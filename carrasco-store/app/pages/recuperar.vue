<script setup lang="ts">
const supabase = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const sent = ref(false)

async function handleSubmit() {
  errorMsg.value = ''
  loading.value = true

  const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
    redirectTo: `${window.location.origin}/`,
  })

  loading.value = false

  if (error) {
    errorMsg.value = error.message
    return
  }

  // Supabase no revela si el correo existe o no (evita filtrar cuentas
  // registradas): el mensaje de exito es el mismo en ambos casos.
  sent.value = true
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <p class="auth-card__eyebrow">Acceso</p>
      <h1>Recupera tu contraseña</h1>

      <template v-if="sent">
        <p class="auth-card__subtitle">
          Si <strong>{{ email }}</strong> tiene una cuenta con nosotros, te enviamos un correo con
          instrucciones para crear una nueva contraseña.
        </p>
        <NuxtLink to="/login" class="btn btn-outline auth-card__submit">Volver a iniciar sesión</NuxtLink>
      </template>

      <form v-else @submit.prevent="handleSubmit">
        <p class="auth-card__subtitle">Te enviaremos un enlace a tu correo para crear una nueva contraseña.</p>

        <label for="email">Correo electrónico</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="tucorreo@ejemplo.com"
        >

        <p v-if="errorMsg" class="auth-card__error" role="alert">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary auth-card__submit" :class="{ 'btn--loading': loading }" :disabled="loading" :aria-busy="loading">
          {{ loading ? 'Enviando…' : 'Enviar enlace' }}
        </button>

        <p class="auth-card__footer">
          <NuxtLink to="/login">← Volver a iniciar sesión</NuxtLink>
        </p>
      </form>
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
