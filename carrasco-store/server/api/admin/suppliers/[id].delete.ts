import { eq } from 'drizzle-orm'
import { manualSales, products, suppliers } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  // Las FK no tienen ON DELETE: si el proveedor esta en uso, borrarlo dejaria
  // productos/ventas apuntando a un id inexistente. Se bloquea y se pide
  // reasignar primero.
  const [inUseProduct] = await db.select({ id: products.id })
    .from(products).where(eq(products.supplierId, id)).limit(1)
  const [inUseSale] = await db.select({ id: manualSales.id })
    .from(manualSales).where(eq(manualSales.supplierId, id)).limit(1)

  if (inUseProduct || inUseSale) {
    throw createError({
      statusCode: 409,
      statusMessage: 'El proveedor está asignado a productos o ventas. Reasígnalos antes de eliminarlo.',
    })
  }

  const [row] = await db.delete(suppliers).where(eq(suppliers.id, id)).returning({ id: suppliers.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Proveedor no encontrado' })
  return { success: true }
})
