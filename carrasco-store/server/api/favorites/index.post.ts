import { and, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { favorites, products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'favorites-add', limit: 30, windowMs: 60_000 })

  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion' })
  }

  const body = await readBody(event)
  if (!body?.productId || typeof body.productId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'productId es requerido' })
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, body.productId) })
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  }

  // Insert atomico con "on conflict do nothing" sobre el indice unico
  // (userId, productId): dos pestanas/dispositivos marcando el mismo
  // producto casi a la vez ya no compiten en un check-then-insert separado
  // (eso lanzaba 500 por violar el indice cuando ambas veian "no favorito").
  const [created] = await db.insert(favorites)
    .values({ userId: user.sub, productId: body.productId })
    .onConflictDoNothing({ target: [favorites.userId, favorites.productId] })
    .returning()

  const favorite = created ?? await db.query.favorites.findFirst({
    where: and(eq(favorites.userId, user.sub), eq(favorites.productId, body.productId)),
  })

  return {
    id: favorite!.id,
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: product.images?.[0] ?? null,
    price: product.price,
    type: product.type,
  }
})
