// Publico: el carrito (app/pages/cart.vue) necesita el costo de envio vigente
// para mostrar el mismo total que luego calculara el checkout.
export default defineEventHandler(async () => {
  return getStoreSettings()
})
