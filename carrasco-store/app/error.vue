<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const isNotFound = computed(() => props.error?.statusCode === 404)

useSeoMeta({
  title: isNotFound.value ? 'Página no encontrada' : 'Ocurrió un error',
})

function handleBackHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <div class="error-page__card">
      <p class="error-page__code">{{ error?.statusCode ?? 500 }}</p>
      <h1 v-if="isNotFound">Esta página no existe</h1>
      <h1 v-else>Algo salió mal</h1>
      <p class="error-page__message">
        <template v-if="isNotFound">
          El enlace que seguiste puede estar roto o la página fue movida. Revisa la dirección o vuelve al inicio.
        </template>
        <template v-else>
          Ocurrió un error inesperado al procesar tu solicitud. Puedes volver al inicio e intentarlo nuevamente.
        </template>
      </p>
      <button class="btn btn-primary error-page__btn" @click="handleBackHome">
        Volver al inicio
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--color-bg);
}
.error-page__card {
  text-align: center;
  max-width: 420px;
  padding: 2.5rem 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-accent);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
.error-page__code {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-accent);
  letter-spacing: 0.06em;
  margin: 0 0 0.5rem;
}
.error-page__card h1 {
  font-size: 1.6rem;
  margin-bottom: 0.6rem;
}
.error-page__message {
  color: var(--color-ink-muted);
  font-size: 0.92rem;
  margin: 0 0 1.5rem;
}
.error-page__btn {
  width: 100%;
}
</style>
