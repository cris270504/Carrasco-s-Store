import { and, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { favorites } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion' })
  }

  const productId = getRouterParam(event, 'productId')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'productId es requerido' })
  }

  await db.delete(favorites)
    .where(and(eq(favorites.userId, user.sub), eq(favorites.productId, productId)))

  return { removed: true }
})
