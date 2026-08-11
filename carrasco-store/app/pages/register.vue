<script setup lang="ts">
const supabase = useSupabaseClient()

const fullName = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

async function handleRegister() {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: { full_name: fullName.value },
    },
  })

  loading.value = false

  if (error) {
    errorMsg.value = error.message
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
      >

      <p v-if="errorMsg" class="auth-card__error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="auth-card__success">{{ successMsg }}</p>

      <button type="submit" class="btn btn-primary auth-card__submit" :disabled="loading">
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