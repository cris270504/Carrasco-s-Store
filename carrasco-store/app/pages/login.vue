<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const confirm = useConfirm()

// Llegamos aqui desde el registro: aviso modal para confirmar el correo (CU-V08).
onMounted(async () => {
  if (route.query.registro !== '1') return
  const { registro, ...rest } = route.query
  await navigateTo({ path: route.path, query: rest }, { replace: true })
  await confirm({
    title: 'Cuenta creada',
    message: 'Revisa tu correo para confirmarla antes de ingresar.',
    confirmLabel: 'Entendido',
    notice: true,
  })
})

// Si ya hay sesión activa, no tiene sentido mostrar el formulario de login.
if (user.value) {
  await navigateTo((route.query.redirect as string) || '/dashboard')
}

async function handleLogin() {
  loading.value = true

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })

  loading.value = false

  if (error) {
    // "Email not confirmed" solo lo devuelve Supabase cuando la contraseña es
    // correcta, asi que avisar de la confirmacion no revela nada extra. Las
    // credenciales invalidas siguen generalizadas (no confirman si el correo existe).
    if (error.message === 'Email not confirmed') {
      await confirm({
        title: 'Confirma tu correo',
        message: 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada (y spam) y abre el enlace que te enviamos.',
        confirmLabel: 'Entendido',
        notice: true,
      })
    }
    else {
      await confirm({
        title: 'No pudimos iniciar sesión',
        message: error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message,
        confirmLabel: 'Entendido',
        notice: true,
      })
    }
    return
  }

  const redirectTo = (route.query.redirect as string) || '/dashboard'
  await navigateTo(redirectTo)
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="handleLogin">
      <p class="auth-card__eyebrow">Acceso</p>
      <h1>Inicia sesión</h1>
      <p class="auth-card__subtitle">Consulta tus pedidos, licencias y agendamientos.</p>

      <label for="email">Correo electrónico</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        autocomplete="email"
        placeholder="tucorreo@ejemplo.com"
      >

      <label for="password">Contraseña</label>
      <PasswordInput
        id="password"
        v-model="password"
        required
        autocomplete="current-password"
        placeholder="••••••••"
      />
      <NuxtLink to="/recuperar" class="auth-card__forgot">¿Olvidaste tu contraseña?</NuxtLink>


      <button type="submit" class="btn btn-primary auth-card__submit" :class="{ 'btn--loading': loading }" :disabled="loading" :aria-busy="loading">
        {{ loading ? 'Ingresando…' : 'Ingresar' }}
      </button>

      <p class="auth-card__footer">
        ¿No tienes cuenta? <NuxtLink to="/register">Regístrate</NuxtLink>
      </p>
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
  border: 2px solid var(--color-border-strong);
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
.auth-card__forgot {
  align-self: flex-end;
  font-size: 0.8rem;
  color: var(--color-accent);
  text-decoration: none;
  margin-top: -0.15rem;
}
.auth-card__forgot:hover {
  text-decoration: underline;
}
.auth-card__error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 0;
}
.auth-card__footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin-top: 0.75rem;
}
.auth-card__footer a {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
}
.auth-card__error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 0;
}
.auth-card__success {
  color: var(--color-success);
  font-size: 0.85rem;
  margin: 0;
}
</style>