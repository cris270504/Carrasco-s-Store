export function useIsAdmin() {
  const user = useSupabaseUser()
  const config = useRuntimeConfig()

  return computed(() => {
    const email = user.value?.email?.toLowerCase()
    if (!email) return false

    const adminEmails = (config.public.adminEmails as string)
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)

    return adminEmails.includes(email)
  })
}
