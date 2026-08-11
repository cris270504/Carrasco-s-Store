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

  const payment = await getMpPayment(String(paymentId))
  const orderId = payment.external_reference
  if (!orderId) {
    return { received: true }
  }

  await db.update(orders)
    .set({
      mpPaymentId: String(payment.id),
      paymentStatus: payment.status,
      status: payment.status === 'approved' ? 'paid' : 'pending_payment',
    })
    .where(eq(orders.id, orderId))

  return { received: true }
})
