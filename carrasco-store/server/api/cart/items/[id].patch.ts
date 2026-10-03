import { eq } from 'drizzle-orm'
import { cartItems } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const body = await readBody(event)
  const quantity = Number(body?.quantity)
  if (!Number.isFinite(quantity)) {
    throw createError({ statusCode: 400, statusMessage: 'quantity debe ser numerico' })
  }

  const cart = await getOrCreateCart(event)
  const item = await db.query.cartItems.findFirst({ where: eq(cartItems.id, id) })
  if (!item || item.cartId !== cart.id) {
    throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
  }

  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, id))
  }
  else {
    const nextQuantity = Math.min(Math.floor(quantity), 50)
    // Sin esta validacion, subir la cantidad por PATCH saltaba el stock que
    // POST /api/cart/items sí respeta.
    if (item.itemType === 'physical') {
      const found = await getProductForCart(item.productId, item.variantId)
      if (found && nextQuantity > found.stock) {
        throw createError({ statusCode: 400, statusMessage: `Stock insuficiente (disponible: ${found.stock})` })
      }
    }
    await db.update(cartItems).set({ quantity: nextQuantity }).where(eq(cartItems.id, id))
  }

  return getCartResponse(cart.id)
})
