import { randomUUID } from 'node:crypto'

const MP_API_BASE = 'https://api.mercadopago.com'

// Monto minimo por cuota que acepta Mercado Pago en Peru. Por debajo de esto
// la Orders API responde 'invalid_transaction_amount'. Verificar si cambia el
// pais de operacion.
export const MP_MIN_AMOUNT_PEN = 10

function getAccessToken() {
  const token = useRuntimeConfig().mpAccessToken
  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Mercado Pago no esta configurado (falta MP_ACCESS_TOKEN en .env)',
    })
  }
  return token
}

// Public key: se usa en el navegador para tokenizar la tarjeta con el SDK v2.
// No es secreta, pero se entrega desde el backend (en la respuesta de /init)
// en vez de exponerla por runtimeConfig para no tenerla hardcodeada en el bundle.
export function getMpPublicKey() {
  const key = useRuntimeConfig().mpPublicKey
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Mercado Pago no esta configurado (falta MP_PUBLIC_KEY en .env)',
    })
  }
  return key
}

// Nombre del comercio en el resumen de tarjeta del comprador (reduce
// contracargos por "no reconozco este cargo"). Limite conservador de MP: 13
// caracteres, sin espacios/acentos.
const STATEMENT_DESCRIPTOR = 'CARRASCOSTORE'

// ============================================================
// PREFERENCE (solo para habilitar el boton "Mercado Pago Wallet")
// ============================================================
// Ya NO se usa para redirigir: con Checkout API el pago con tarjeta/debito es
// 100% embebido. La Preference solo sirve para obtener un id que habilita el
// medio "Mercado Pago Wallet" (donde vive Yape) en el Payment Brick — ese
// medio SIEMPRE redirige a MP (funciona como Checkout Pro internamente).
// Si esta llamada falla, el checkout igual funciona: no aparece esa opcion.

export interface MpPreferenceItem {
  id: string
  title: string
  description?: string
  quantity: number
  unit_price: number
}

export interface MpPreferencePayer {
  email: string
  name?: string
  surname?: string
  phone?: { number: string }
  address?: { street_name: string, zip_code?: string }
}

export async function createMpPreference(params: {
  items: MpPreferenceItem[]
  payer: MpPreferencePayer
  externalReference: string
  successUrl: string
  failureUrl: string
  pendingUrl: string
  notificationUrl: string
}) {
  const token = getAccessToken()

  return $fetch<{ id: string, init_point: string }>(`${MP_API_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      items: params.items.map(item => ({ ...item, currency_id: 'PEN' })),
      payer: params.payer,
      statement_descriptor: STATEMENT_DESCRIPTOR,
      binary_mode: true,
      external_reference: params.externalReference,
      back_urls: {
        success: params.successUrl,
        failure: params.failureUrl,
        pending: params.pendingUrl,
      },
      notification_url: params.notificationUrl,
    },
  })
}

// ============================================================
// ORDERS API (Checkout API via Orders) — POST /v1/orders
// ============================================================

export interface MpOrderPaymentInput {
  paymentMethodId: string
  paymentTypeId: string
  token: string
  installments: number
  payerEmail: string
  payerFirstName?: string
  payerLastName?: string
  payerIdentification?: { type?: string, number?: string }
}

export interface MpOrderItemInput {
  title: string
  quantity: number
  unitPrice: string
}

export interface MpOrderPayment {
  id: string
  status: string
  status_detail?: string
  amount?: string
}

export interface MpOrder {
  id: string
  status: string
  status_detail?: string
  external_reference?: string
  transactions?: { payments?: MpOrderPayment[] }
  // Forma real de la respuesta de error de /v1/orders.
  errors?: Array<{ code?: string, message?: string, details?: string[] }>
}

export async function createMpOrder(params: {
  amount: string
  externalReference: string
  description: string
  items: MpOrderItemInput[]
  payment: MpOrderPaymentInput
}): Promise<MpOrder> {
  const token = getAccessToken()

  return $fetch<MpOrder>(`${MP_API_BASE}/v1/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Requisito de la Orders API: una clave distinta por intento. Un
      // reintento con la MISMA clave y el mismo body devuelve la respuesta
      // cacheada; un intento nuevo (otra tarjeta tras un rechazo) necesita
      // clave nueva.
      'X-Idempotency-Key': randomUUID(),
    },
    body: {
      type: 'online',
      total_amount: params.amount,
      external_reference: params.externalReference,
      processing_mode: 'automatic',
      description: params.description,
      items: params.items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        category_id: 'service',
      })),
      transactions: {
        payments: [{
          amount: params.amount,
          payment_method: {
            id: params.payment.paymentMethodId,
            // additionalData.paymentTypeId del Brick; 'credit_card' como fallback.
            type: params.payment.paymentTypeId || 'credit_card',
            token: params.payment.token,
            installments: params.payment.installments || 1,
            statement_descriptor: STATEMENT_DESCRIPTOR,
          },
        }],
      },
      // NO agregar additional_info.payer.* aca: la Orders API lo rechaza
      // ("additionalProperties 'payer' not allowed") aunque la "Medicion de
      // calidad de integracion" lo sugiera.
      payer: {
        email: params.payment.payerEmail,
        first_name: params.payment.payerFirstName,
        last_name: params.payment.payerLastName,
        identification: params.payment.payerIdentification,
      },
    },
  })
}

export async function getMpOrder(orderId: string): Promise<MpOrder> {
  const token = getAccessToken()
  return $fetch<MpOrder>(`${MP_API_BASE}/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// Busca un pedido en MP por external_reference (nuestro orders.id) para el
// caso en que el proceso se cayo entre el claim atomico y la persistencia del
// mpOrderId (ver server/api/admin/orders/[id]/reconcile.post.ts). Si el
// endpoint de busqueda no responde como se espera, el catch del caller trata
// esto como "no encontrado" en vez de romper.
export async function findMpOrderByExternalReference(externalReference: string): Promise<MpOrder | null> {
  const token = getAccessToken()
  const result = await $fetch<{ elements?: MpOrder[] }>(`${MP_API_BASE}/v1/orders/search`, {
    query: { external_reference: externalReference },
    headers: { Authorization: `Bearer ${token}` },
  })
  return result.elements?.[0] ?? null
}

// Extrae el mensaje de error de una respuesta fallida de /v1/orders.
// $fetch lanza un FetchError con el cuerpo de la respuesta en `.data`.
export function extractMpOrderError(err: unknown): string {
  const data = (err as { data?: MpOrder })?.data
  return data?.errors?.[0]?.details?.[0]
    || data?.errors?.[0]?.message
    || 'Mercado Pago no pudo procesar el pago. Intenta con otra tarjeta.'
}

// ============================================================
// PAYMENTS API clasica — solo para webhooks legado (type: 'payment')
// ============================================================
export async function getMpPayment(paymentId: string) {
  const token = getAccessToken()
  return $fetch<{ id: number, status: string, external_reference: string }>(
    `${MP_API_BASE}/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}
