<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)

if (user.value) {
  await navigateTo('/dashboard')
}

// Validacion en vivo de la regla de contraseña (CU-V08): muestra qué falta.
const passwordMissing = computed(() => (password.value ? passwordIssues(password.value) : []))
const passwordMismatch = computed(() => confirmPassword.value.length > 0 && confirmPassword.value !== password.value)
// Correo ya registrado: se avisa explicitamente y se ofrece iniciar sesión (CU-V08).
const emailTaken = ref(false)

async function handleRegister() {
  errorMsg.value = ''
  emailTaken.value = false

  if (passwordMissing.value.length > 0 || passwordMismatch.value) {
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

  // Con confirmacion de correo activa, Supabase no da error para un correo
  // existente: devuelve un usuario sin identidades. Se detecta por cualquiera de
  // las dos señales.
  const alreadyExists = (error && /already registered|already exists/i.test(error.message))
    || (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
  if (alreadyExists) {
    emailTaken.value = true
    errorMsg.value = 'Ya existe una cuenta con este correo.'
    return
  }

  if (error) {
    errorMsg.value = error.message
    return
  }

  if (data.session) {
    await navigateTo('/dashboard')
  }
  else {
    // Redirige a /login, donde se muestra el aviso "Revisa tu correo" (CU-V08).
    await navigateTo({ path: '/login', query: { registro: '1' } })
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
      <PasswordInput
        id="password"
        v-model="password"
        required
        autocomplete="new-password"
        placeholder="Mínimo 8 caracteres"
        :invalid="passwordMissing.length > 0"
      />
      <p v-if="passwordMissing.length" class="field__error">Falta: {{ passwordMissing.join(', ') }}.</p>

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

      <p v-if="errorMsg" class="auth-card__error" role="alert">
        {{ errorMsg }}
        <NuxtLink v-if="emailTaken" to="/login">Iniciar sesión</NuxtLink>
      </p>

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