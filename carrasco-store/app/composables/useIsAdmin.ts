// La verificacion real vive en el servidor (server/utils/requireAdmin.ts); este
// composable es solo un hint de UI (mostrar/ocultar el link "Admin"), por eso
// ya no compara contra una lista de correos expuesta en runtimeConfig.public
// — esa lista no debe viajar al cliente (ver server/api/admin/whoami.get.ts).
export function useIsAdmin() {
  const user = useSupabaseUser()
  const isAdmin = useState('is-admin', () => false)

  watch(user, async (current) => {
    if (!current) {
      isAdmin.value = false
      return
    }
    isAdmin.value = await $fetch('/api/admin/whoami').then(() => true).catch(() => false)
  }, { immediate: true })

  return isAdmin
}
