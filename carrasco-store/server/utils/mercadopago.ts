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
  quantity: number
  unit_price: number
}

export async function createMpPreference(params: {
  items: MpPreferenceItem[]
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
      external_reference: params.externalReference,
      back_urls: {
        success: params.successUrl,
        failure: params.failureUrl,
        pending: params.pendingUrl,
      },
      auto_return: 'approved',
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
