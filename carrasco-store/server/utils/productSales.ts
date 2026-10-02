import { eq, inArray } from 'drizzle-orm'
import { manualSales, orderItems } from '../database/schema'

// Un producto "tiene ventas" si aparece en al menos un order_items o en al
// menos un manual_sales (venta particular registrada a mano). Fuente unica
// de verdad: tanto el listado admin (que anticipa en la UI si el boton va a
// desactivar o eliminar) como el DELETE (que decide de verdad) deben
// responder siempre lo mismo a esta pregunta.
export async function productHasSales(productId: string): Promise<boolean> {
  const [orderSale, manualSale] = await Promise.all([
    db.query.orderItems.findFirst({
      where: eq(orderItems.productId, productId),
      columns: { id: true },
    }),
    db.query.manualSales.findFirst({
      where: eq(manualSales.productId, productId),
      columns: { id: true },
    }),
  ])
  return !!orderSale || !!manualSale
}

export async function productsWithSales(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set()

  const rows = await db.selectDistinct({ productId: orderItems.productId })
    .from(orderItems)
    .where(inArray(orderItems.productId, productIds))

  return new Set(rows.map(r => r.productId))
}
