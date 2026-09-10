import { and, eq } from 'drizzle-orm'
import { orders } from '../../database/schema'

// Mercado Pago notifica por POST (webhooks v2: { type, data: { id } }) o por
// query string (IPN legado: ?topic=...&id=...). Debe responder rapido.
//
// Con Checkout API via Orders el tipo relevante es 'order' (GET /v1/orders/{id},
// se itera transactions.payments buscando status 'processed'). Se mantiene el
// tipo legado 'payment' (GET /v1/payments/{id}, esa API no cambio: aprobado
// sigue siendo 'approved') por si quedan pagos creados con el flujo anterior.
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'checkout-webhook', limit: 60, windowMs: 60_000 })

  const body = await readBody(event).catch(() => null)
  const query = getQuery(event)

  const dataId = body?.data?.id ?? query.id
  const type = body?.type ?? body?.topic ?? query.type ?? query.topic
  if (!dataId) {
    return { received: true }
  }

  if (!verifyMpWebhookSignature(event, String(dataId))) {
    throw createError({ statusCode: 401, statusMessage: 'Firma de webhook invalida' })
  }

  if (type === 'order') {
    const mpOrder = await getMpOrder(String(dataId)).catch(() => null)
    const orderId = mpOrder?.external_reference
    if (!mpOrder || !orderId) {
      return { received: true }
    }

    const approved = mpOrder.transactions?.payments?.find(p => p.status === 'processed')
    if (approved) {
      await fulfillOrder(event, orderId, { mpOrderId: mpOrder.id, mpPaymentId: approved.id })
    }
    else {
      // Estado no terminal-exitoso: se refleja en paymentStatus sin tocar
      // orders.status. No se cancela la orden automaticamente por un rechazo
      // (a diferencia del flujo Checkout Pro): el comprador puede reintentar.
      await db.update(orders)
        .set({ mpOrderId: mpOrder.id, paymentStatus: mpOrder.status })
        .where(and(eq(orders.id, orderId), eq(orders.status, 'pending_payment')))
    }
    return { received: true }
  }

  if (type === 'payment') {
    const payment = await getMpPayment(String(dataId)).catch(() => null)
    const orderId = payment?.external_reference
    if (!payment || !orderId) {
      return { received: true }
    }

    if (payment.status === 'approved') {
      await fulfillOrder(event, orderId, { mpPaymentId: String(payment.id) })
    }
    else {
      await db.update(orders)
        .set({ paymentStatus: payment.status })
        .where(and(eq(orders.id, orderId), eq(orders.status, 'pending_payment')))
    }
    return { received: true }
  }

  return { received: true }
})
