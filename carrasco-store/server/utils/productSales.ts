import { eq, inArray } from 'drizzle-orm'
import { orderItems } from '../database/schema'

// Un producto "tiene ventas" si aparece en al menos un order_items. Fuente
// unica de verdad: tanto el listado admin (que anticipa en la UI si el boton
// va a desactivar o eliminar) como el DELETE (que decide de verdad) deben
// responder siempre lo mismo a esta pregunta.
export async function productHasSales(productId: string): Promise<boolean> {
  const sale = await db.query.orderItems.findFirst({
    where: eq(orderItems.productId, productId),
    columns: { id: true },
  })
  return !!sale
}

export async function productsWithSales(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set()

  const rows = await db.selectDistinct({ productId: orderItems.productId })
    .from(orderItems)
    .where(inArray(orderItems.productId, productIds))

  return new Set(rows.map(r => r.productId))
}
