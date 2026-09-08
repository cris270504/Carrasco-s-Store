<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

if (user.value) {
  await navigateTo('/dashboard')
}

// Validacion en vivo: antes solo se sabia de un typo en la confirmacion de
// contraseña despues de enviar todo el formulario.
const passwordTooShort = computed(() => password.value.length > 0 && password.value.length < 6)
const passwordMismatch = computed(() => confirmPassword.value.length > 0 && confirmPassword.value !== password.value)

async function handleRegister() {
  errorMsg.value = ''
  successMsg.value = ''

  if (passwordTooShort.value || passwordMismatch.value) {
    errorMsg.value = 'Revisa la contraseña antes de continuar.'
    return
  }

  loading.value = true

  const { data, error } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value,
    options: {
      data: { full_name: fullName.value.trim() },
    },
  })

  loading.value = false

  if (error) {
    // Mensaje generico para "ya existe una cuenta con este correo": mostrar
    // el error de Supabase tal cual confirmaria que el correo esta
    // registrado (fuga de existencia de cuentas).
    errorMsg.value = /already registered|already exists/i.test(error.message)
      ? 'No pudimos completar el registro. Si ya tienes una cuenta, intenta iniciar sesión.'
      : error.message
    return
  }

  if (data.session) {
    await navigateTo('/dashboard')
  }
  else {
    successMsg.value = 'Cuenta creada. Revisa tu correo para confirmarla antes de ingresar.'
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="handleRegister">
      <p class="auth-card__eyebrow">Nueva cuenta</p>
      <h1>Crea tu cuenta</h1>
      <p class="auth-card__subtitle">Sigue tus compras, licencias y servicios en un solo lugar.</p>

      <label for="fullName">Nombre completo</label>
      <input id="fullName" v-model="fullName" type="text" required placeholder="Tu nombre">

      <label for="email">Correo electrónico</label>
      <input id="email" v-model="email" type="email" required autocomplete="email" placeholder="tucorreo@ejemplo.com">

      <label for="password">Contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        minlength="6"
        autocomplete="new-password"
        placeholder="Mínimo 6 caracteres"
        :class="{ 'is-invalid': passwordTooShort }"
      >
      <p v-if="passwordTooShort" class="field__error">Debe tener al menos 6 caracteres.</p>

      <label for="confirmPassword">Confirmar contraseña</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        required
        minlength="6"
        autocomplete="new-password"
        placeholder="Repite tu contraseña"
        :class="{ 'is-invalid': passwordMismatch }"
      >
      <p v-if="passwordMismatch" class="field__error">Las contraseñas no coinciden.</p>

      <p v-if="errorMsg" class="auth-card__error" role="alert">{{ errorMsg }}</p>
      <p v-if="successMsg" class="auth-card__success" role="status">{{ successMsg }}</p>

      <button type="submit" class="btn btn-primary auth-card__submit" :class="{ 'btn--loading': loading }" :disabled="loading" :aria-busy="loading">
        {{ loading ? 'Creando cuenta…' : 'Registrarme' }}
      </button>

      <p class="auth-card__footer">
        ¿Ya tienes cuenta? <NuxtLink to="/login">Inicia sesión</NuxtLink>
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
.auth-card input.is-invalid {
  border-color: var(--color-danger);
}
.field__error {
  margin: -0.3rem 0 0;
  font-size: 0.76rem;
  color: var(--color-danger);
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
.auth-card__success {
  color: var(--color-success);
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
</style>