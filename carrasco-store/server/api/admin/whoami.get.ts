// Endpoint minimo para que el cliente sepa si el usuario actual es admin sin
// necesitar la lista de correos admin en el bundle publico (ver
// app/composables/useIsAdmin.ts y app/middleware/admin.ts). requireAdmin ya
// tira 403 si no lo es, asi que llegar aca con 200 ES la respuesta.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { isAdmin: true }
})
