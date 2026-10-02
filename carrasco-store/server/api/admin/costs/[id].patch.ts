import { eq } from 'drizzle-orm'
import { products } from '../../../database/schema'

// Edicion rapida de la fila de costos de un producto: precio de venta, costo
// de compra y proveedor. Cambiar el costo actualiza cost_updated_at.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const body = await readBody(event)
  const updates: Partial<typeof products.$inferInsert> = {}

  if (body?.price !== undefined) {
    updates.price = parsePositiveAmount(body.price, 'El precio de venta debe ser mayor a 0').toFixed(2)
  }

  if ('costPrice' in (body ?? {})) {
    updates.costPrice = (body.costPrice === null || body.costPrice === '')
      ? null
      : parseNonNegativeAmount(body.costPrice, 'El costo de compra no puede ser negativo').toFixed(2)
    updates.costUpdatedAt = new Date()
  }

  if ('supplierId' in (body ?? {})) {
    updates.supplierId = await resolveSupplierId(body.supplierId)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nada que actualizar' })
  }

  const [row] = await db.update(products).set(updates).where(eq(products.id, id))
    .returning({
      id: products.id,
      price: products.price,
      costPrice: products.costPrice,
      supplierId: products.supplierId,
      costUpdatedAt: products.costUpdatedAt,
    })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  return row
})
