import { and, eq } from 'drizzle-orm'
import { orders } from '../../../../database/schema'
import type { MpOrder } from '../../../../utils/mercadopago'

// Estados de la Orders API que significan "MP todavia esta resolviendo el
// pago" (ver el comentario de confirm.post.ts): liberar el reclamo en estos
// casos permitiria un segundo intento de cobro (confirm.post.ts vuelve a
// reclamar cualquier orden en 'pending_payment') mientras el intento anterior
// todavia puede terminar aprobado en MP, arriesgando un cobro duplicado.
const MP_ORDER_IN_FLIGHT_STATUSES = new Set(['processing', 'action_required', 'in_review', 'created'])
// Idem para /v1/payments (webhook legado / rama mpPaymentId).
const MP_PAYMENT_IN_FLIGHT_STATUSES = new Set(['in_process', 'pending'])

// Reconciliacion manual de una orden en limbo: si Mercado Pago quedo en
// 'processing'/'action_required'/'in_review' y el webhook nunca llego (o se
// perdio), esta orden se queda en 'pending_payment' para siempre desde el
// punto de vista del sitio, aunque el pago ya se haya resuelto del lado de MP.
// Este endpoint le da al admin una forma de consultar el estado real en MP y,
// si corresponde, disparar el mismo fulfillOrder que usa el webhook. No hay
// cron en este proyecto: esto reemplaza esa reconciliacion automatica.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) })
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Orden no encontrada' })
  }

  if (order.status !== 'pending_payment' && order.status !== 'payment_in_progress') {
    return { reconciled: false, reason: 'La orden ya no esta en un estado que requiera reconciliacion', status: order.status }
  }

  if (order.mpOrderId) {
    const mpOrder = await getMpOrder(order.mpOrderId).catch(() => null)
    if (!mpOrder) {
      throw createError({ statusCode: 502, statusMessage: 'No se pudo consultar la orden en Mercado Pago' })
    }

    const approved = mpOrder.transactions?.payments?.find(p => p.status === 'processed')
    if (approved) {
      await fulfillOrder(event, order.id, { mpOrderId: mpOrder.id, mpPaymentId: approved.id })
      return { reconciled: true, status: 'processed', orderId: order.id }
    }

    if (MP_ORDER_IN_FLIGHT_STATUSES.has(mpOrder.status)) {
      await db.update(orders)
        .set({ mpOrderId: mpOrder.id, paymentStatus: mpOrder.status })
        .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
      return { reconciled: false, reason: `Mercado Pago todavia esta resolviendo el pago (estado "${mpOrder.status}"); no se libera el reclamo`, status: mpOrder.status }
    }

    // Estado terminal no aprobado (failed/canceled/charged_back/expired): se
    // libera el reclamo volviendo a 'pending_payment' (igual que
    // confirm.post.ts) para que el boton "Conciliar" no quede pegado
    // reportando el mismo estado para siempre.
    await db.update(orders)
      .set({ status: 'pending_payment', mpOrderId: mpOrder.id, paymentStatus: mpOrder.status })
      .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
    return { reconciled: false, reason: `Mercado Pago reporta el estado "${mpOrder.status}"`, status: mpOrder.status }
  }

  if (order.mpPaymentId) {
    const payment = await getMpPayment(order.mpPaymentId).catch(() => null)
    if (!payment) {
      throw createError({ statusCode: 502, statusMessage: 'No se pudo consultar el pago en Mercado Pago' })
    }

    if (payment.status === 'approved') {
      await fulfillOrder(event, order.id, { mpPaymentId: String(payment.id) })
      return { reconciled: true, status: 'processed', orderId: order.id }
    }

    if (MP_PAYMENT_IN_FLIGHT_STATUSES.has(payment.status)) {
      await db.update(orders)
        .set({ paymentStatus: payment.status })
        .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
      return { reconciled: false, reason: `Mercado Pago todavia esta resolviendo el pago (estado "${payment.status}"); no se libera el reclamo`, status: payment.status }
    }

    await db.update(orders)
      .set({ status: 'pending_payment', paymentStatus: payment.status })
      .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
    return { reconciled: false, reason: `Mercado Pago reporta el estado "${payment.status}"`, status: payment.status }
  }

  // Sin mpOrderId/mpPaymentId local: el proceso pudo haberse caido entre el
  // claim atomico (confirm.post.ts) y la persistencia de la respuesta de MP.
  // Antes de liberar el reclamo se busca en MP por external_reference (=
  // order.id) para no arriesgar reintentar un cobro que si se proceso del
  // lado de MP pero nunca se guardo localmente. Un error de la busqueda en si
  // (red, MP caido) NO es lo mismo que "MP confirma que no existe": si la
  // busqueda falla no se sabe si el pago se hizo o no, asi que se rechaza en
  // vez de liberar el reclamo (evita reintentar un cobro que si se proceso).
  let foundOrder: MpOrder | null
  try {
    foundOrder = await findMpOrderByExternalReference(order.id)
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'No se pudo verificar en Mercado Pago si esta orden tiene un pago asociado' })
  }

  if (foundOrder) {
    const approved = foundOrder.transactions?.payments?.find(p => p.status === 'processed')
    if (approved) {
      await fulfillOrder(event, order.id, { mpOrderId: foundOrder.id, mpPaymentId: approved.id })
      return { reconciled: true, status: 'processed', orderId: order.id }
    }

    if (MP_ORDER_IN_FLIGHT_STATUSES.has(foundOrder.status)) {
      await db.update(orders)
        .set({ mpOrderId: foundOrder.id, paymentStatus: foundOrder.status })
        .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
      return { reconciled: false, reason: `Mercado Pago todavia esta resolviendo el pago (estado "${foundOrder.status}"); no se libera el reclamo`, status: foundOrder.status }
    }

    await db.update(orders)
      .set({ status: 'pending_payment', mpOrderId: foundOrder.id, paymentStatus: foundOrder.status })
      .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
    return { reconciled: false, reason: `Mercado Pago reporta el estado "${foundOrder.status}"`, status: foundOrder.status }
  }

  await db.update(orders)
    .set({ status: 'pending_payment' })
    .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
  return { reconciled: false, reason: 'Mercado Pago no tiene ningun pedido registrado para esta orden; se libero el reclamo para reintentar', status: null }
})
