import type { H3Event } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'

// Valida el header x-signature que Mercado Pago envia en cada webhook, segun
// su esquema documentado: HMAC-SHA256 sobre "id:<dataId>;request-id:<x-request-id>;ts:<ts>;"
// usando la clave secreta del webhook (distinta del access token).
// A diferencia de MP_ACCESS_TOKEN/RESEND_API_KEY (features que simplemente no
// pueden funcionar sin su clave), esto es un control de seguridad: si
// MP_WEBHOOK_SECRET falta, se falla CERRADO (se rechaza la notificacion) en
// vez de aceptar cualquier payload sin autenticar.
export function verifyMpWebhookSignature(event: H3Event, dataId: string): boolean {
  const secret = useRuntimeConfig(event).mpWebhookSecret
  if (!secret) {
    console.error('[MP] MP_WEBHOOK_SECRET no configurada: se rechaza el webhook (fail-closed)')
    return false
  }

  const signatureHeader = getHeader(event, 'x-signature')
  const requestId = getHeader(event, 'x-request-id')
  if (!signatureHeader || !requestId) return false

  const parts: Record<string, string> = {}
  for (const segment of signatureHeader.split(',')) {
    const [key, value] = segment.split('=').map(s => s.trim())
    if (key && value) parts[key] = value
  }
  const { ts, v1 } = parts
  if (!ts || !v1) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  const expectedBuf = Buffer.from(expected, 'hex')
  const receivedBuf = Buffer.from(v1, 'hex')
  if (expectedBuf.length !== receivedBuf.length) return false

  return timingSafeEqual(expectedBuf, receivedBuf)
}
