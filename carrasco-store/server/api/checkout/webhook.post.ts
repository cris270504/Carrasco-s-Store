import { eq } from 'drizzle-orm'
import { orders } from '../../database/schema'

// Mercado Pago notifica pagos por POST (webhooks v2: { type, data: { id } })
// o por query string (IPN legado: ?topic=payment&id=...). Debe responder rapido.
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const query = getQuery(event)

  const paymentId = body?.data?.id ?? query.id
  const type = body?.type ?? query.topic

  if (type !== 'payment' || !paymentId) {
    return { received: true }
  }

  if (!verifyMpWebhookSignature(event, String(paymentId))) {
    throw createError({ statusCode: 401, statusMessage: 'Firma de webhook invalida' })
  }

  const payment = await getMpPayment(String(paymentId))
  const orderId = payment.external_reference
  if (!orderId) {
    return { received: true }
  }

  // rejected/cancelled son estados terminales de fallo: la orden pasa a
  // 'cancelled' en vez de quedar varada en 'pending_payment' para siempre.
  // Estados intermedios (pending, in_process, etc.) no se tocan aca.
  const updates: Partial<typeof orders.$inferInsert> = {
    mpPaymentId: String(payment.id),
    paymentStatus: payment.status,
  }
  if (payment.status === 'rejected' || payment.status === 'cancelled') {
    updates.status = 'cancelled'
  }

  await db.update(orders).set(updates).where(eq(orders.id, orderId))

  if (payment.status === 'approved') {
    await fulfillOrder(event, orderId)
  }

  return { received: true }
})
