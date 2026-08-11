import { eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { cartItems, orderItems, orders, productVariants, products } from '../../database/schema'

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

  for (const item of cartData.items) {
    if (item.itemType !== 'physical') continue

    const available = item.variantId
      ? (await db.query.productVariants.findFirst({ where: eq(productVariants.id, item.variantId) }))?.stock
      : (await db.query.products.findFirst({ where: eq(products.id, item.productId) }))?.stock

    if ((available ?? 0) < item.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stock insuficiente para "${item.name}" (disponible: ${available ?? 0})`,
      })
    }
  }

  const subtotal = cartData.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const hasPhysicalItem = cartData.items.some(i => i.itemType === 'physical')
  const tax = calcTax(subtotal)
  const shippingCost = calcShipping(hasPhysicalItem)
  const total = subtotal + tax + shippingCost

  const [order] = await db.insert(orders).values({
    userId: user.sub,
    status: 'pending_payment',
    subtotal: String(subtotal),
    tax: String(tax),
    shippingCost: String(shippingCost),
    total: String(total),
  }).returning()

  await db.insert(orderItems).values(
    cartData.items.map(item => ({
      orderId: order!.id,
      productId: item.productId,
      variantId: item.variantId,
      itemType: item.itemType,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
    })),
  )

  const origin = getRequestURL(event).origin

  const preference = await createMpPreference({
    items: cartData.items.map(item => ({
      id: item.productId,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
    externalReference: order!.id,
    successUrl: `${origin}/checkout/success`,
    failureUrl: `${origin}/checkout/failure`,
    pendingUrl: `${origin}/checkout/pending`,
    notificationUrl: `${origin}/api/checkout/webhook`,
  })

  await db.update(orders)
    .set({ mpPreferenceId: preference.id })
    .where(eq(orders.id, order!.id))

  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))

  // sandbox_init_point solo viene presente cuando la preferencia se crea con
  // credenciales/cuenta de prueba; hay que usarlo en vez de init_point para probar.
  return { orderId: order!.id, initPoint: preference.sandbox_init_point || preference.init_point }
})
