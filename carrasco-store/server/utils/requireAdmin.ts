import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

// Boundary real de seguridad para el panel admin: el middleware de ruta en el
// cliente (app/middleware/admin.ts) solo oculta la UI, cualquiera puede llamar
// a la API directamente, asi que cada endpoint /api/admin/** debe revalidar aca.
export async function requireAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event).catch(() => null)
  const email = user?.email?.toLowerCase()

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean)

  if (!email || !adminEmails.includes(email)) {
    throw createError({ statusCode: 403, statusMessage: 'No autorizado' })
  }

  return user
}
