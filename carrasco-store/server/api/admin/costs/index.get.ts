import { asc } from 'drizzle-orm'
import { products } from '../../../database/schema'
import { calculateMargin } from '../../../../shared/utils/margin'

// Tabla PRODUCTO | PRECIO DE COMPRA | PROVEEDOR | PRECIO DE VENTA | GANANCIA
// que el equipo mantiene. Trae todos los productos (activos e inactivos).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db.query.products.findMany({
    orderBy: [asc(products.type), asc(products.name)],
    columns: {
      id: true,
      name: true,
      type: true,
      price: true,
      costPrice: true,
      supplierId: true,
      costUpdatedAt: true,
      isActive: true,
    },
    with: { supplier: { columns: { id: true, name: true } } },
  })

  return rows.map((p) => {
    const price = Number(p.price)
    const cost = p.costPrice === null ? null : Number(p.costPrice)
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      isActive: p.isActive,
      price: p.price,
      costPrice: p.costPrice,
      supplier: p.supplier ?? null,
      costUpdatedAt: p.costUpdatedAt,
      // GANANCIA = venta - compra (null si no hay costo cargado)
      margin: cost === null ? null : calculateMargin(price, cost, 1),
      marginPct: cost !== null && price > 0
        ? Math.round(((price - cost) / price) * 100)
        : null,
    }
  })
})
