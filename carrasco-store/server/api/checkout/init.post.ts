import { and, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { addresses, orderItems, orders } from '../../database/schema'

// Paso 1 de 2 del checkout (Checkout API via Orders): "iniciar pago".
// Valida el carrito, RECALCULA el monto contra el catalogo vigente (nunca se
// confia en nada del cliente), crea la orden en 'pending_payment' y devuelve
// lo que el Payment Brick necesita para montarse. El cobro real ocurre en el
// paso 2 (confirm.post.ts).
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'checkout', limit: 5, windowMs: 60_000 })

  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion para pagar' })
  }

  // Falla temprano si MP no esta configurado, antes de crear una orden huerfana.
  const publicKey = getMpPublicKey()

  const cart = await getOrCreateCart(event)
  const cartData = await getCartResponse(cart.id)

  if (cartData.items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'El carrito esta vacio' })
  }

  // El precio se re-verifica contra el catalogo en este momento (nunca se
  // confia en el snapshot guardado en cart_items al agregarlo): si el admin
  // cambio el precio despues de que el cliente lo agrego al carrito, se cobra
  // el precio vigente, igual que ya se hace con el stock.
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
  // de generar la orden de pago, no despues de cobrar.
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

  if (total < MP_MIN_AMOUNT_PEN) {
    throw createError({
      statusCode: 400,
      statusMessage: `El monto minimo de pago con Mercado Pago es S/ ${MP_MIN_AMOUNT_PEN.toFixed(2)}.`,
    })
  }

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

  const shortId = order!.id.slice(0, 8).toUpperCase()
  const description = `Pedido ${shortId} - Carrasco Store`

  // El motor antifraude de Mercado Pago usa nombre/apellido del pagador para
  // calificar el riesgo de la transaccion; sin esto sube la tasa de rechazo.
  const fullName = (user.user_metadata as { full_name?: string } | undefined)?.full_name?.trim()
  const [payerName, ...payerSurnameParts] = fullName ? fullName.split(/\s+/) : []
  const payerSurname = payerSurnameParts.length > 0 ? payerSurnameParts.join(' ') : null

  // La Preference es OPCIONAL: solo habilita el boton "Mercado Pago Wallet"
  // (Yape) en el Brick. Si falla, el checkout con tarjeta/debito funciona
  // igual — simplemente no aparece esa opcion.
  let preferenceId: string | null = null
  try {
    const origin = getRequestURL(event).origin
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
        surname: payerSurname ?? undefined,
        phone: shippingAddress?.phone ? { number: shippingAddress.phone } : undefined,
        address: shippingAddress ? { street_name: shippingAddress.line1 } : undefined,
      },
      externalReference: order!.id,
      successUrl: `${origin}/checkout/success`,
      failureUrl: `${origin}/checkout/failure`,
      pendingUrl: `${origin}/checkout/pending`,
      notificationUrl: `${origin}/api/checkout/webhook`,
    })
    preferenceId = preference.id
    await db.update(orders).set({ mpPreferenceId: preference.id }).where(eq(orders.id, order!.id))
  }
  catch {
    // Sin preferencia: se sigue sin la opcion de Wallet.
  }

  // El carrito NO se vacia aca: se conserva hasta que el pago quede aprobado
  // (ver fulfillOrder). Si el pago falla o se abandona, el carrito sigue
  // intacto para reintentar sobre esta misma orden.
  return {
    orderId: order!.id,
    publicKey,
    amount: total.toFixed(2),
    description,
    preferenceId,
    payer: {
      email: user.email,
      firstName: payerName ?? null,
      lastName: payerSurname,
    },
  }
})
