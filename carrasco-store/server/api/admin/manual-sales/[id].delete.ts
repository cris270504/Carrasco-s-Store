import { eq } from 'drizzle-orm'
import { manualSales } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const [row] = await db.delete(manualSales).where(eq(manualSales.id, id)).returning({ id: manualSales.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Venta no encontrada' })
  return { success: true }
})
