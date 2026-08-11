import { eq } from 'drizzle-orm'
import { products } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: true,
      serviceDetail: true,
      licenses: { columns: { id: true, status: true } },
    },
  })

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  }

  return product
})
