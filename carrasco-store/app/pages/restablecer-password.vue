<script setup lang="ts">
// Sin middleware 'auth': la sesion temporal de recuperacion ya la establece
// Supabase al procesar el link, un guard de sesion normal no aplica aca.
// En cambio, SI se exige el flag que pone app/plugins/auth-recovery.client.ts
// al recibir el evento PASSWORD_RECOVERY: sin el, cualquier usuario que ya
// tenga una sesion normal iniciada podria entrar directo a esta URL y
// cambiar su contraseña sin volver a autenticarse.
const supabase = useSupabaseClient()
const toast = useToast()

if (import.meta.client && !sessionStorage.getItem('password-recovery')) {
  await navigateTo('/login', { replace: true })
}

const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleSubmit() {
  errorMsg.value = ''

  if (password.value.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  const { error } = await supabase.auth.updateUser({ password: password.value })

  if (error) {
    loading.value = false
    errorMsg.value = error.message
    return
  }

  sessionStorage.removeItem('password-recovery')
  // Invalida cualquier otra sesion activa (ej. un token robado que motivo el
  // cambio de contraseña): la de esta pestaña queda como la unica valida.
  await supabase.auth.signOut({ scope: 'others' })
  loading.value = false

  toast.success('Tu contraseña fue actualizada.')
  await navigateTo('/dashboard')
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="handleSubmit">
      <p class="auth-card__eyebrow">Nueva contraseña</p>
      <h1>Crea tu nueva contraseña</h1>
      <p class="auth-card__subtitle">Elige una contraseña nueva para tu cuenta.</p>

      <label for="password">Nueva contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        minlength="6"
        autocomplete="new-password"
        placeholder="Mínimo 6 caracteres"
      >

      <label for="confirmPassword">Confirmar contraseña</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        required
        minlength="6"
        autocomplete="new-password"
        placeholder="Repite tu contraseña"
      >

      <p v-if="errorMsg" class="auth-card__error" role="alert">{{ errorMsg }}</p>

      <button type="submit" class="btn btn-primary auth-card__submit" :class="{ 'btn--loading': loading }" :disabled="loading" :aria-busy="loading">
        {{ loading ? 'Guardando…' : 'Guardar contraseña' }}
      </button>
    </form>
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
  gap: 0.55rem;
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-accent);
  border-radius: var(--radius-card);
  padding: 2rem 1.75rem;
  box-shadow: var(--shadow-card);
}
.auth-card__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}
.auth-card h1 {
  font-size: 1.4rem;
  margin-bottom: 0.15rem;
}
.auth-card__subtitle {
  color: var(--color-ink-muted);
  font-size: 0.88rem;
  margin: 0 0 0.75rem;
}
.auth-card label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-ink-muted);
}
.auth-card input {
  font-family: var(--font-body);
  font-size: 0.92rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-bg);
  color: var(--color-ink);
}
.auth-card input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--color-surface);
}
.auth-card__submit {
  margin-top: 0.75rem;
  width: 100%;
}
.auth-card__error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 0;
}
</style>
