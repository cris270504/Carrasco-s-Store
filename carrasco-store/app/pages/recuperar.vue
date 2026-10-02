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
.auth-card label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  margin-bottom: 0.5rem;
}
.auth-card input {
  font-family: var(--font-body);
  font-size: 1rem;
  width: 100%;
  padding: 0.9rem 1.1rem;
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
  margin-top: 1rem;
  width: 100%;
  padding-top: 0.9rem;
  padding-bottom: 0.9rem;
  font-size: 1rem;
}
.auth-card__error {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 0.5rem 0 0;
}
.auth-card__footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  margin-top: 1rem;
}
.auth-card__footer a {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
}
</style>
