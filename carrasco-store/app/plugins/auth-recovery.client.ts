// El link del correo de recuperacion establece una sesion automaticamente y
// Supabase emite el evento PASSWORD_RECOVERY. Sin capturarlo, el usuario cae
// logueado en donde sea que el Site URL apunte, sin haber cambiado nada.
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const router = useRouter()

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      router.push('/restablecer-password')
    }
  })
})
