import type { H3Event } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'

// Valida el header x-signature que Mercado Pago envia en cada webhook, segun
// su esquema documentado: HMAC-SHA256 sobre "id:<dataId>;request-id:<x-request-id>;ts:<ts>;"
// usando la clave secreta del webhook (distinta del access token).
// Si MP_WEBHOOK_SECRET no esta configurada, no se puede verificar; se deja pasar
// con un aviso en logs en vez de romper el flujo (igual que MP_ACCESS_TOKEN/RESEND_API_KEY).
export function verifyMpWebhookSignature(event: H3Event, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[MP] MP_WEBHOOK_SECRET no configurada: no se pudo verificar el origen del webhook')
    return true
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
