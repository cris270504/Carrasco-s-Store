<script setup lang="ts">
// El correo de confirmacion de cuenta trae el token aca en vez de un link que
// Supabase verificaria con un simple GET: asi, un escaneo automatico del
// correo (Outlook, Gmail, antivirus) no consume el token de un solo uso
// antes de que el usuario le de clic de verdad (mismo problema y misma
// solucion que restablecer-password.vue para el enlace de recuperacion).
const supabase = useSupabaseClient()
const toast = useToast()
const route = useRoute()

const verifyError = ref('')

onMounted(async () => {
  const tokenHash = route.query.token_hash
  const tokenType = route.query.type

  if (typeof tokenHash !== 'string' || tokenType !== 'signup') {
    verifyError.value = 'Este enlace de confirmación no es válido.'
    return
  }

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'signup' })
  if (error) {
    verifyError.value = 'Este enlace ya expiró o ya fue usado. Si ya confirmaste tu cuenta antes, inicia sesión normalmente.'
    return
  }

  toast.success('Tu cuenta quedó confirmada.')
  await navigateTo('/dashboard', { replace: true })
})
</script>

<template>
  <div class="auth-page">
    <div v-if="verifyError" class="auth-card">
      <p class="auth-card__eyebrow">Enlace inválido</p>
      <h1>No pudimos confirmar tu cuenta</h1>
      <p class="auth-card__subtitle">{{ verifyError }}</p>
      <NuxtLink to="/login" class="btn btn-primary auth-card__submit">Ir a iniciar sesión</NuxtLink>
    </div>

    <div v-else class="auth-card">
      <p class="auth-card__eyebrow">Acceso</p>
      <h1>Confirmando tu cuenta…</h1>
      <p class="auth-card__subtitle">Un momento, por favor.</p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}
.auth-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  max-width: 460px;
  background: var(--color-surface);
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  padding: 3rem 2.75rem;
  box-shadow: var(--shadow-card);
}
.auth-card__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}
.auth-card h1 {
  font-size: 1.75rem;
  margin-bottom: 0.2rem;
}
.auth-card__subtitle {
  color: var(--color-ink-muted);
  font-size: 0.98rem;
  line-height: 1.5;
  margin: 0 0 1.25rem;
}
.auth-card__submit {
  margin-top: 1rem;
  width: 100%;
  padding-top: 0.9rem;
  padding-bottom: 0.9rem;
  font-size: 1rem;
}
</style>
