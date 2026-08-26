// Este middleware solo oculta la UI (el boundary real es requireAdmin en cada
// endpoint /api/admin/**, ver ese archivo). Se pregunta directo al servidor
// en vez de leer el useState de useIsAdmin(), que es eventualmente consistente
// y podria no haberse resuelto todavia en el momento exacto de la navegacion.
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/catalogo')
  }

  try {
    await $fetch('/api/admin/whoami')
  }
  catch {
    return navigateTo('/catalogo')
  }
})
