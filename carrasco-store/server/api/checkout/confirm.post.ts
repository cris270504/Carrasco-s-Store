import { and, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { orders } from '../../database/schema'

// Paso 2 de 2 del checkout (Checkout API via Orders): "confirmar pago".
// Recibe el formData ya tokenizado que entrega el callback onSubmit del Payment
// Brick (el numero de tarjeta nunca toca el backend), RECALCULA el monto desde
// la orden guardada en el servidor (nunca desde el cliente) y hace POST a
// /v1/orders.
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'checkout-confirm', limit: 10, windowMs: 60_000 })

  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion para pagar' })
  }

  const body = await readBody(event).catch(() => null)
  const orderId = body?.orderId
  const formData = body?.formData
  const paymentTypeId = body?.paymentTypeId as string | undefined

  if (typeof orderId !== 'string' || !formData?.token || !formData?.payment_method_id) {
    throw createError({ statusCode: 400, statusMessage: 'Datos de pago incompletos' })
  }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
  if (!order || order.userId !== user.sub) {
    throw createError({ statusCode: 404, statusMessage: 'Orden no encontrada' })
  }
  if (order.status !== 'pending_payment') {
    // Ya pagada / en fulfillment / cancelada: no se vuelve a cobrar.
    throw createError({ statusCode: 409, statusMessage: 'Esta orden ya no admite pagos' })
  }

  // El monto SIEMPRE sale de la orden guardada en /init (calculada contra el
  // catalogo vigente), nunca de nada que mande el navegador.
  const amount = Number(order.total).toFixed(2)
  const shortId = order.id.slice(0, 8).toUpperCase()
  const description = `Pedido ${shortId} - Carrasco Store`

  const fullName = (user.user_metadata as { full_name?: string } | undefined)?.full_name?.trim()
  const [firstName, ...surnameParts] = fullName ? fullName.split(/\s+/) : []

  let mpOrder
  try {
    mpOrder = await createMpOrder({
      amount,
      externalReference: order.id,
      description,
      // Item unico que resume la orden: los renglones detallados ya viven en
      // nuestra tabla order_items. Asi el total_amount y la suma de items
      // coinciden siempre (sin desajustes de redondeo por IGV/envio).
      items: [{ title: description, quantity: 1, unitPrice: amount }],
      payment: {
        paymentMethodId: formData.payment_method_id,
        paymentTypeId: paymentTypeId || formData.payment_type_id || 'credit_card',
        token: formData.token,
        installments: Number(formData.installments) || 1,
        payerEmail: user.email!,
        payerFirstName: firstName,
        payerLastName: surnameParts.length > 0 ? surnameParts.join(' ') : undefined,
        payerIdentification: formData.payer?.identification,
      },
    })
  }
  catch (err) {
    // Error de validacion de la Orders API (token vencido, monto invalido...).
    throw createError({ statusCode: 400, statusMessage: extractMpOrderError(err) })
  }

  const payment = mpOrder.transactions?.payments?.[0]
  const paymentId = payment?.id ?? null

  // Enums de ESTADO de la Orders API (NO los de /v1/payments):
  //   processed                                  -> aprobado
  //   failed                                     -> rechazado
  //   processing | action_required | in_review   -> en curso
  //   canceled | charged_back | expired | created
  if (mpOrder.status === 'processed') {
    await fulfillOrder(event, order.id, { mpOrderId: mpOrder.id, mpPaymentId: paymentId })
    return { status: 'processed', orderId: order.id }
  }

  // No aprobado: se refleja el estado real en paymentStatus pero NO se toca
  // orders.status — la orden sigue en 'pending_payment' para que el comprador
  // reintente sobre la MISMA orden desde el Brick. (Con Checkout Pro un rechazo
  // cancelaba la orden; embebido, se reintenta en el sitio.)
  await db.update(orders)
    .set({ mpOrderId: mpOrder.id, mpPaymentId: paymentId, paymentStatus: mpOrder.status })
    .where(and(eq(orders.id, order.id), eq(orders.status, 'pending_payment')))

  if (mpOrder.status === 'failed') {
    return { status: 'failed', orderId: order.id, detail: payment?.status_detail ?? null }
  }
  return { status: mpOrder.status, orderId: order.id }
})
