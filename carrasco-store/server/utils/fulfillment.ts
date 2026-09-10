import type { H3Event } from 'h3'
import { and, eq, gte, sql } from 'drizzle-orm'
import { serverSupabaseServiceRole } from '#supabase/server'
import {
  addresses,
  cartItems,
  carts,
  digitalLicenses,
  orderItems,
  orders,
  paymentReviewFlags,
  productVariants,
  products,
  serviceBookings,
  serviceDetails,
} from '../database/schema'

type OrderItem = typeof orderItems.$inferSelect
type OrderRow = typeof orders.$inferSelect
type OrderItemWithProduct = OrderItem & { product: { name: string } }

interface MpPaymentInfo {
  mpOrderId?: string | null
  mpPaymentId?: string | null
}

// Aplica un pago APROBADO ('processed' en Orders API) a la orden: descuenta
// stock, entrega licencias, crea bookings y vacia el carrito. La llaman tanto
// el paso sincrono "confirmar pago" (server/api/checkout/confirm.post.ts) como
// el webhook asincrono — cualquiera que llegue primero deja todo consistente.
//
// El UPDATE...WHERE status='pending_payment' es atomico y tambien graba los
// ids de Mercado Pago en la MISMA sentencia: si dos llamadas (confirm +
// webhook, o dos notificaciones) corren casi juntas, solo una consigue la
// fila; la otra ve claimed vacio y sale sin efectos (no duplica stock /
// licencia / booking / cobro).
export async function fulfillOrder(event: H3Event, orderId: string, mp: MpPaymentInfo = {}) {
  const claimed = await db.update(orders)
    .set({
      status: 'processing',
      paymentStatus: 'processed',
      ...(mp.mpOrderId ? { mpOrderId: mp.mpOrderId } : {}),
      ...(mp.mpPaymentId ? { mpPaymentId: mp.mpPaymentId } : {}),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'pending_payment')))
    .returning()

  const order = claimed[0]
  if (!order) {
    // No se pudo reclamar: la orden ya esta en fulfillment o pagada. Suele ser
    // la segunda llegada normal (confirm + webhook del mismo cobro); pero si
    // trae un id de pago DISTINTO al ya registrado, es un posible doble cobro.
    await flagPossibleDoublePayment(orderId, mp)
    return
  }

  try {
    // Congela el costo vigente de cada producto en el momento del pago, para
    // que el margen historico (dashboard de finanzas) no cambie si despues se
    // actualiza products.cost_price.
    await db.execute(sql`
      update "order_items" oi
      set "unit_cost" = p."cost_price"
      from "products" p
      where oi."product_id" = p."id" and oi."order_id" = ${orderId} and oi."unit_cost" is null
    `)

    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
      with: { product: { columns: { name: true } } },
    })

    for (const item of items) {
      if (item.itemType === 'physical') {
        await fulfillPhysical(item)
      }
      else if (item.itemType === 'digital') {
        await fulfillDigital(event, item, order.userId)
      }
      else if (item.itemType === 'service') {
        await fulfillService(item, order.userId)
      }
    }

    await db.update(orders).set({ status: 'paid' }).where(eq(orders.id, orderId))

    // Recien aca se vacia el carrito: si el pago hubiera fallado, el usuario
    // conserva lo seleccionado para reintentar (ver server/api/checkout/init.post.ts).
    const cart = await db.query.carts.findFirst({ where: eq(carts.userId, order.userId) })
    if (cart) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    }

    // Avisos de compra (correo + WhatsApp a duenos y comprador). Best-effort:
    // no debe revertir ni ensuciar una orden ya pagada si un canal falla.
    notifyOrderParties(event, order, items).catch(err =>
      console.error('[notify] orden pagada:', err),
    )
  }
  catch (err) {
    // Revierte el claim para que un reintento del webhook pueda volver a procesarla
    // en vez de quedar atascada en 'processing' para siempre.
    await db.update(orders).set({ status: 'pending_payment' }).where(eq(orders.id, orderId))
    throw err
  }
}

// Se llama cuando fulfillOrder no pudo reclamar la orden (ya no esta en
// 'pending_payment'). Si el id de pago que llega es el mismo ya registrado, es
// solo la segunda notificacion del mismo cobro y no hay nada que hacer. Si es
// distinto, quedo un cobro extra sin aplicar: se deja constancia en
// payment_review_flags para revision manual en vez de perderlo.
async function flagPossibleDoublePayment(orderId: string, mp: MpPaymentInfo) {
  if (!mp.mpPaymentId) return

  const current = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { mpPaymentId: true, status: true },
  })
  if (!current || current.mpPaymentId === mp.mpPaymentId) return

  await db.insert(paymentReviewFlags).values({
    orderId,
    mpOrderId: mp.mpOrderId ?? null,
    mpPaymentId: mp.mpPaymentId,
    reason: `Segundo pago (${mp.mpPaymentId}) recibido para una orden en estado "${current.status}" `
      + `ya asociada al pago ${current.mpPaymentId ?? 'desconocido'}.`,
  })
  console.error(
    `[MP] Posible doble cobro en orden ${orderId}: pago nuevo ${mp.mpPaymentId}, `
    + `pago existente ${current.mpPaymentId ?? 'desconocido'}`,
  )
}

// Avisos de una orden pagada: correo + WhatsApp a los duenos y al comprador.
// Todo best-effort (ver notify.ts / sendEmail / sendWhatsappNotice).
async function notifyOrderParties(event: H3Event, order: OrderRow, items: OrderItemWithProduct[]) {
  const shortId = order.id.slice(0, 8).toUpperCase()
  const total = Number(order.total)
  const lineItems = items.map(i => ({ name: i.product.name, quantity: i.quantity }))

  const revenue = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0)
  const cost = items.reduce((s, i) => s + (i.unitCost === null ? 0 : Number(i.unitCost)) * i.quantity, 0)

  // Email del comprador (auth.users vive en el schema de Supabase).
  let buyerEmail: string | null = null
  try {
    const supabase = serverSupabaseServiceRole(event)
    const { data } = await supabase.auth.admin.getUserById(order.userId)
    buyerEmail = data.user?.email ?? null
  }
  catch {
    // sin service role configurado: el comprador no recibe correo, pero la
    // orden ya quedo bien
  }

  // Telefono: el de la direccion de envio si existe, si no el capturado en el
  // checkout digital/servicio (orders.buyerPhone).
  let phone = order.buyerPhone
  if (!phone && order.shippingAddressId) {
    const addr = await db.query.addresses.findFirst({
      where: eq(addresses.id, order.shippingAddressId),
      columns: { phone: true },
    })
    phone = addr?.phone ?? null
  }

  await Promise.allSettled([
    notifyOwnersOfSale({
      kind: 'store',
      title: lineItems.map(i => `${i.quantity}× ${i.name}`).join(', '),
      total,
      profit: Math.round((revenue - cost) * 100) / 100,
      orderShortId: shortId,
    }),
    notifyBuyerOfOrder({ email: buyerEmail, phone, orderShortId: shortId, items: lineItems, total }),
  ])
}

// Decremento atomico: solo resta si hay stock suficiente EN LA MISMA sentencia
// (WHERE stock >= qty), asi que dos ordenes concurrentes para el mismo
// producto/variante nunca pueden restar ambas del mismo stock insuficiente
// (a diferencia de un SELECT-then-UPDATE en JS, que es una carrera clasica).
async function fulfillPhysical(item: OrderItem) {
  if (item.variantId) {
    const [decremented] = await db.update(productVariants)
      .set({ stock: sql`greatest(${productVariants.stock} - ${item.quantity}, 0)` })
      .where(and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.quantity)))
      .returning({ id: productVariants.id })

    if (!decremented) {
      // El pago ya esta aprobado (no se puede "des-vender"): se fuerza el
      // stock a 0 y se deja constancia para reconciliacion manual en vez de
      // fallar en silencio o dejar un stock negativo escondido.
      await db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.id, item.variantId))
      console.warn(`[fulfillment] Sobreventa detectada: variante ${item.variantId}, orderItem ${item.id}`)
    }
    return
  }

  const [decremented] = await db.update(products)
    .set({ stock: sql`greatest(${products.stock} - ${item.quantity}, 0)` })
    .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
    .returning({ id: products.id })

  if (!decremented) {
    await db.update(products).set({ stock: 0 }).where(eq(products.id, item.productId))
    console.warn(`[fulfillment] Sobreventa detectada: producto ${item.productId}, orderItem ${item.id}`)
  }
}

// Reclamo atomico de una licencia disponible: SELECT ... FOR UPDATE SKIP LOCKED
// dentro de una transaccion bloquea la fila elegida hasta el commit, asi que
// una segunda transaccion concurrente para el mismo producto directamente
// salta esa fila (SKIP LOCKED) y toma la siguiente disponible (o ninguna) en
// vez de leer la misma fila "available" que la primera antes de que confirme.
async function fulfillDigital(event: H3Event, item: OrderItem, userId: string) {
  const claimedLicense = await db.transaction(async (tx) => {
    const [license] = await tx.select().from(digitalLicenses)
      .where(and(eq(digitalLicenses.productId, item.productId), eq(digitalLicenses.status, 'available')))
      .limit(1)
      .for('update', { skipLocked: true })

    if (!license) return null

    await tx.update(digitalLicenses)
      .set({ status: 'reserved', orderItemId: item.id })
      .where(eq(digitalLicenses.id, license.id))

    return license
  })

  if (!claimedLicense) return // sin stock de licencias: la orden queda para atencion manual

  const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) })
  if (!product) return

  try {
    const supabase = serverSupabaseServiceRole(event)
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !data.user?.email) throw new Error('sin email de usuario')

    await sendLicenseEmail({ to: data.user.email, productName: product.name, code: decryptLicenseCode(claimedLicense.code) })

    await db.update(digitalLicenses)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(digitalLicenses.id, claimedLicense.id))
  }
  catch {
    // el codigo queda 'reserved' si falla el envio (credenciales de Resend/Supabase
    // service role faltantes o error de red); permite reintento o entrega manual
  }
}

async function fulfillService(item: OrderItem, userId: string) {
  const detail = await db.query.serviceDetails.findFirst({ where: eq(serviceDetails.productId, item.productId) })

  await db.insert(serviceBookings).values({
    orderItemId: item.id,
    userId,
    productId: item.productId,
    modality: detail?.defaultModality ?? 'remote',
    status: 'pending',
  })
}
