import { and, eq } from 'drizzle-orm'
import { products } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug es requerido' })
  }

  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: {
      variants: true,
      serviceDetail: true,
    },
  })

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  }

  return product
})
