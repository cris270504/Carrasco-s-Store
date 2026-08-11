import type { H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

// Limitador en memoria por IP. En un solo proceso (ej. servidor persistente)
// es totalmente efectivo; en plataformas serverless con multiples instancias
// (Vercel) es "best effort" ya que cada instancia fria tiene su propio mapa,
// pero igual eleva el costo de un abuso trivial y no requiere infra externa.
const buckets = new Map<string, Bucket>()

export function enforceRateLimit(event: H3Event, options: { key: string, limit: number, windowMs: number }) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const bucketKey = `${options.key}:${ip}`
  const now = Date.now()

  const bucket = buckets.get(bucketKey)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
    return
  }

  bucket.count += 1
  if (bucket.count > options.limit) {
    throw createError({ statusCode: 429, statusMessage: 'Demasiadas solicitudes, intenta de nuevo en un momento' })
  }
}
