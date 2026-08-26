import { eq } from 'drizzle-orm'
import { cartItems, products } from '../../../database/schema'

// Un producto con historial de ventas (order_items) nunca se borra físicamente:
// se desactiva para preservar la trazabilidad de órdenes pasadas y porque
// order_items.product_id no tiene ON DELETE CASCADE (por diseño). Sin ventas,
// se elimina de verdad: primero se limpian los cart_items sueltos que lo
// referencien (tampoco cascadean) y luego el producto, que sí cascadea a
// variantes, licencias y detalle de servicio.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const existing = await db.query.products.findFirst({
    where: eq(products.id, id),
    columns: { id: true },
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  }

  if (await productHasSales(id)) {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id))
    return { success: true, mode: 'disabled' as const }
  }

  await db.delete(cartItems).where(eq(cartItems.productId, id))
  await db.delete(products).where(eq(products.id, id))
  return { success: true, mode: 'deleted' as const }
})
