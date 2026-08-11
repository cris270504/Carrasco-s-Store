import { eq } from 'drizzle-orm'
import { cartItems } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const cart = await getOrCreateCart(event)
  const item = await db.query.cartItems.findFirst({ where: eq(cartItems.id, id) })
  if (!item || item.cartId !== cart.id) {
    throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
  }

  await db.delete(cartItems).where(eq(cartItems.id, id))

  return getCartResponse(cart.id)
})
