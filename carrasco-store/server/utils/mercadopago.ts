const MP_API_BASE = 'https://api.mercadopago.com'

function getAccessToken() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Mercado Pago no esta configurado (falta MP_ACCESS_TOKEN en .env)',
    })
  }
  return token
}

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

// Nombre del comercio en el resumen de tarjeta del comprador (reduce
// contracargos por "no reconozco este cargo"). Limite conservador de MP: 13
// caracteres, sin espacios/acentos.
const STATEMENT_DESCRIPTOR = 'CARRASCOSTORE'

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
      // El motor antifraude de Mercado Pago usa los datos del pagador para
      // calificar el riesgo de la transaccion; sin esto la tasa de rechazo
      // de pagos legitimos sube.
      payer: params.payer,
      statement_descriptor: STATEMENT_DESCRIPTOR,
      // Fuerza una respuesta final (aprobado/rechazado) en vez de dejar el
      // pago en 'in_process'/'pending' por medios que lo permiten: el
      // fulfillment de este negocio es automatico e instantaneo, no tiene
      // sentido un estado intermedio prolongado.
      binary_mode: true,
      external_reference: params.externalReference,
      back_urls: {
        success: params.successUrl,
        failure: params.failureUrl,
        pending: params.pendingUrl,
      },
      // auto_return requiere back_urls publicamente alcanzables; en localhost falla.
      // Sin el, el comprador vuelve al sitio con un clic en "Volver" desde MP.
      notification_url: params.notificationUrl,
    },
  })
}

export async function getMpPayment(paymentId: string) {
  const token = getAccessToken()
  return $fetch<{ id: number, status: string, external_reference: string }>(
    `${MP_API_BASE}/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}
