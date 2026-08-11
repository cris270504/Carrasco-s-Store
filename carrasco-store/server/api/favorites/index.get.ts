import { desc, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { favorites } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion' })
  }

  const rows = await db.query.favorites.findMany({
    where: eq(favorites.userId, user.sub),
    orderBy: [desc(favorites.createdAt)],
    with: { product: true },
  })

  return rows.map(row => ({
    id: row.id,
    productId: row.productId,
    name: row.product.name,
    slug: row.product.slug,
    image: row.product.images?.[0] ?? null,
    price: row.product.price,
    type: row.product.type,
  }))
})
