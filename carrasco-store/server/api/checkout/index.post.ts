import { and, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { addresses, orderItems, orders } from '../../database/schema'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'checkout', limit: 5, windowMs: 60_000 })

  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion para pagar' })
  }

  const cart = await getOrCreateCart(event)
  const cartData = await getCartResponse(cart.id)

  if (cartData.items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'El carrito esta vacio' })
  }

  // El precio se re-verifica contra el catalogo en este momento (nunca se
  // confia en el snapshot guardado en cart_items al agregarlo): si el admin
  // cambio el precio despues de que el cliente lo agrego al carrito, se cobra
  // el precio vigente, igual que ya se hace con el stock.
  // getProductForCart ya trae el stock vigente junto con el precio: se
  // reutiliza aca en vez de repetir una query de stock por item (N+1).
  const pricedItems = await Promise.all(cartData.items.map(async (item) => {
    const found = await getProductForCart(item.productId, item.variantId)
    if (!found) {
      throw createError({ statusCode: 400, statusMessage: `"${item.name}" ya no está disponible` })
    }
    return {
      ...item,
      unitPrice: found.unitPrice,
      description: found.product.description,
      stock: found.stock,
      requiresShipping: found.product.requiresShipping,
    }
  }))

  for (const item of pricedItems) {
    if (item.itemType !== 'physical') continue

    if (item.stock < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stock insuficiente para "${item.name}" (disponible: ${item.stock})`,
      })
    }
  }

  // Sin direccion no hay a donde despachar un producto fisico: se exige antes
  // de generar la preferencia de pago, no despues de cobrar.
  const needsAddress = pricedItems.some(i => i.itemType === 'physical' && i.requiresShipping)
  let shippingAddress: typeof addresses.$inferSelect | undefined

  if (needsAddress) {
    const body = await readBody(event).catch(() => null)
    const addressId = body?.addressId
    if (!addressId || typeof addressId !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Selecciona una dirección de envío' })
    }

    shippingAddress = await db.query.addresses.findFirst({
      where: and(eq(addresses.id, addressId), eq(addresses.userId, user.sub)),
    })
    if (!shippingAddress) {
      throw createError({ statusCode: 400, statusMessage: 'Dirección de envío no válida' })
    }
  }

  const subtotal = pricedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const hasPhysicalItem = pricedItems.some(i => i.itemType === 'physical')
  const { shippingFlatRate } = await getStoreSettings()
  // El IGV ya esta incluido en unitPrice (ver shared/utils/pricing.ts): se
  // guarda como referencia para la orden, pero no se suma otra vez al total.
  const tax = calcTax(subtotal)
  const shippingCost = calcShipping(hasPhysicalItem, shippingFlatRate)
  const total = subtotal + shippingCost

  const [order] = await db.insert(orders).values({
    userId: user.sub,
    status: 'pending_payment',
    subtotal: String(subtotal),
    tax: String(tax),
    shippingCost: String(shippingCost),
    total: String(total),
    shippingAddressId: shippingAddress?.id,
  }).returning()

  await db.insert(orderItems).values(
    pricedItems.map(item => ({
      orderId: order!.id,
      productId: item.productId,
      variantId: item.variantId,
      itemType: item.itemType,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
    })),
  )

  const origin = getRequestURL(event).origin

  // El motor antifraude de Mercado Pago usa nombre/apellido del pagador para
  // calificar el riesgo de la transaccion; sin esto sube la tasa de rechazo.
  const fullName = (user.user_metadata as { full_name?: string } | undefined)?.full_name?.trim()
  const [payerName, ...payerSurnameParts] = fullName ? fullName.split(/\s+/) : []

  try {
    const preference = await createMpPreference({
      items: pricedItems.map(item => ({
        id: item.productId,
        title: item.name,
        description: item.description ?? undefined,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      payer: {
        email: user.email!,
        name: payerName,
        surname: payerSurnameParts.length > 0 ? payerSurnameParts.join(' ') : undefined,
        phone: shippingAddress?.phone ? { number: shippingAddress.phone } : undefined,
        address: shippingAddress ? { street_name: shippingAddress.line1 } : undefined,
      },
      externalReference: order!.id,
      successUrl: `${origin}/checkout/success`,
      failureUrl: `${origin}/checkout/failure`,
      pendingUrl: `${origin}/checkout/pending`,
      notificationUrl: `${origin}/api/checkout/webhook`,
    })

    await db.update(orders)
      .set({ mpPreferenceId: preference.id })
      .where(eq(orders.id, order!.id))

    // El carrito NO se borra aca: se conserva hasta que el webhook confirme el
    // pago aprobado (ver fulfillOrder en server/utils/fulfillment.ts). Si el
    // pago falla o el usuario abandona en Mercado Pago, el carrito sigue
    // intacto para reintentar sin perder lo seleccionado.
    return { orderId: order!.id, initPoint: preference.init_point }
  }
  catch {
    // No se pudo generar la preferencia de pago (credenciales invalidas, MP caido,
    // etc.): se descarta la orden en vez de dejarla varada en 'pending_payment'
    // para siempre sin ninguna posibilidad de completarse.
    await db.delete(orders).where(eq(orders.id, order!.id))
    throw createError({ statusCode: 502, statusMessage: 'No se pudo iniciar el pago con Mercado Pago. Intenta nuevamente.' })
  }
})
