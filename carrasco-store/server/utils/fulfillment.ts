import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { serverSupabaseServiceRole } from '#supabase/server'
import {
  cartItems,
  carts,
  digitalLicenses,
  orderItems,
  orders,
  productVariants,
  products,
  serviceBookings,
  serviceDetails,
} from '../database/schema'

type OrderItem = typeof orderItems.$inferSelect

// Se dispara desde el webhook de Mercado Pago cuando el pago queda 'approved'.
// El UPDATE...WHERE status='pending_payment' es atomico: si dos notificaciones
// llegan casi simultaneas para la misma orden, solo una consigue la fila (evita
// duplicar descuento de stock / entrega de licencia / creacion de booking).
export async function fulfillOrder(event: H3Event, orderId: string) {
  const claimed = await db.update(orders)
    .set({ status: 'processing' })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'pending_payment')))
    .returning()

  const order = claimed[0]
  if (!order) {
    return
  }

  try {
    const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) })

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
    // conserva lo seleccionado para reintentar (ver server/api/checkout/index.post.ts).
    const cart = await db.query.carts.findFirst({ where: eq(carts.userId, order.userId) })
    if (cart) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    }
  }
  catch (err) {
    // Revierte el claim para que un reintento del webhook pueda volver a procesarla
    // en vez de quedar atascada en 'processing' para siempre.
    await db.update(orders).set({ status: 'pending_payment' }).where(eq(orders.id, orderId))
    throw err
  }
}

async function fulfillPhysical(item: OrderItem) {
  if (item.variantId) {
    const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.id, item.variantId) })
    if (variant) {
      await db.update(productVariants)
        .set({ stock: Math.max(0, (variant.stock ?? 0) - item.quantity) })
        .where(eq(productVariants.id, item.variantId))
    }
    return
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) })
  if (product) {
    await db.update(products)
      .set({ stock: Math.max(0, (product.stock ?? 0) - item.quantity) })
      .where(eq(products.id, item.productId))
  }
}

async function fulfillDigital(event: H3Event, item: OrderItem, userId: string) {
  const license = await db.query.digitalLicenses.findFirst({
    where: and(eq(digitalLicenses.productId, item.productId), eq(digitalLicenses.status, 'available')),
  })
  if (!license) return // sin stock de licencias: la orden queda para atencion manual

  await db.update(digitalLicenses)
    .set({ status: 'reserved', orderItemId: item.id })
    .where(eq(digitalLicenses.id, license.id))

  const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) })
  if (!product) return

  try {
    const supabase = serverSupabaseServiceRole(event)
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !data.user?.email) throw new Error('sin email de usuario')

    await sendLicenseEmail({ to: data.user.email, productName: product.name, code: decryptLicenseCode(license.code) })

    await db.update(digitalLicenses)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(digitalLicenses.id, license.id))
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
