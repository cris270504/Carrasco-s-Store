import { eq } from 'drizzle-orm'
import { products, suppliers } from '../../../database/schema'

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
    const price = Number(body.price)
    if (!Number.isFinite(price) || price <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'El precio de venta debe ser mayor a 0' })
    }
    updates.price = price.toFixed(2)
  }

  if ('costPrice' in (body ?? {})) {
    if (body.costPrice === null || body.costPrice === '') {
      updates.costPrice = null
    }
    else {
      const cost = Number(body.costPrice)
      if (!Number.isFinite(cost) || cost < 0) {
        throw createError({ statusCode: 400, statusMessage: 'El costo de compra no puede ser negativo' })
      }
      updates.costPrice = cost.toFixed(2)
    }
    updates.costUpdatedAt = new Date()
  }

  if ('supplierId' in (body ?? {})) {
    if (!body.supplierId) {
      updates.supplierId = null
    }
    else {
      const [supplier] = await db.select({ id: suppliers.id })
        .from(suppliers).where(eq(suppliers.id, String(body.supplierId))).limit(1)
      if (!supplier) throw createError({ statusCode: 400, statusMessage: 'Proveedor no válido' })
      updates.supplierId = supplier.id
    }
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
