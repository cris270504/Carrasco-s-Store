import { and, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { addresses } from '../../database/schema'

function requiredString(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({ statusCode: 400, statusMessage: `${field} es requerido` })
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw createError({ statusCode: 400, statusMessage: `${field} es demasiado largo` })
  }
  return trimmed
}

function optionalString(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Campo invalido' })
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw createError({ statusCode: 400, statusMessage: 'Campo demasiado largo' })
  }
  return trimmed || null
}

// Guarda (crea o actualiza) la direccion de envio default del usuario. MVP de
// una sola direccion: si ya existe una marcada default, se actualiza en vez
// de acumular filas — un "libro de direcciones" queda para mas adelante.
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion' })
  }

  const body = await readBody(event)

  const values = {
    fullName: requiredString(body?.fullName, 'El nombre', 200),
    line1: requiredString(body?.line1, 'La dirección', 255),
    line2: optionalString(body?.line2, 255),
    city: requiredString(body?.city, 'La ciudad', 120),
    region: optionalString(body?.region, 120),
    phone: optionalString(body?.phone, 30),
  }

  const existing = await db.query.addresses.findFirst({
    where: and(eq(addresses.userId, user.sub), eq(addresses.isDefault, true)),
  })

  if (existing) {
    const [updated] = await db.update(addresses).set(values).where(eq(addresses.id, existing.id)).returning()
    return updated
  }

  const [created] = await db.insert(addresses).values({
    userId: user.sub,
    isDefault: true,
    ...values,
  }).returning()

  return created
})
