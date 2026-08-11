import { eq } from 'drizzle-orm'
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

  const existing = await db.query.favorites.findFirst({
    where: (f, { and: andOp, eq: eqOp }) => andOp(eqOp(f.userId, user.sub), eqOp(f.productId, body.productId)),
  })
  if (existing) {
    return {
      id: existing.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? null,
      price: product.price,
      type: product.type,
    }
  }

  const [created] = await db.insert(favorites).values({
    userId: user.sub,
    productId: body.productId,
  }).returning()

  return {
    id: created!.id,
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: product.images?.[0] ?? null,
    price: product.price,
    type: product.type,
  }
})
