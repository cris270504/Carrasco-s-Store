export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  const config = useRuntimeConfig()

  const adminEmails = (config.public.adminEmails as string)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  const userEmail = user.value?.email?.toLowerCase()

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return navigateTo('/catalogo')
  }
})
