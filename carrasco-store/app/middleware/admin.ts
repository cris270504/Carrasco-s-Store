export default defineNuxtRouteMiddleware(() => {
  const isAdmin = useIsAdmin()

  if (!isAdmin.value) {
    return navigateTo('/catalogo')
  }
})
