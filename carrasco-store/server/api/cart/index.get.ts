export default defineEventHandler(async (event) => {
  const cart = await getOrCreateCart(event)
  return getCartResponse(cart.id)
})
