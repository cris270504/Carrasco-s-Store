import { eq } from 'drizzle-orm'
import { products } from '../../../database/schema'

// Baja lógica (isActive = false) en vez de DELETE físico: preserva la
// integridad de órdenes/carritos históricos que referencian este producto
// y permite reactivarlo luego desde el formulario de edición.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const [updated] = await db.update(products)
    .set({ isActive: false })
    .where(eq(products.id, id))
    .returning({ id: products.id })

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  }

  return { success: true }
})
