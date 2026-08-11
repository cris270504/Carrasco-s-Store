<script setup lang="ts">
interface StatusAction {
  to: string
  label: string
  variant: 'btn-primary' | 'btn-outline'
}

interface StatusContent {
  title: string
  message: string
  tone: string
  actions: StatusAction[]
}

const route = useRoute()
const status = route.params.status as string

const content: Record<string, StatusContent> = {
  success: {
    title: '¡Pago confirmado!',
    message: 'Tu orden fue registrada. Podrás ver su estado en tu panel apenas se acredite.',
    tone: 'is-success',
    actions: [
      { to: '/dashboard', label: 'Ir a mi panel', variant: 'btn-primary' },
      { to: '/catalogo', label: 'Seguir comprando', variant: 'btn-outline' },
    ],
  },
  pending: {
    title: 'Pago en proceso',
    message: 'Estamos esperando la confirmación de Mercado Pago. Te avisaremos cuando se acredite.',
    tone: 'is-pending',
    actions: [
      { to: '/dashboard', label: 'Ir a mi panel', variant: 'btn-primary' },
      { to: '/catalogo', label: 'Seguir comprando', variant: 'btn-outline' },
    ],
  },
  failure: {
    title: 'El pago no se pudo procesar',
    message: 'No se te realizó ningún cargo. Tu carrito sigue intacto: puedes reintentar el pago o elegir otro medio.',
    tone: 'is-failure',
    actions: [
      { to: '/cart', label: 'Volver al carrito', variant: 'btn-primary' },
      { to: '/catalogo', label: 'Seguir comprando', variant: 'btn-outline' },
    ],
  },
}

const info = computed(() => content[status] ?? content.failure!)
</script>

<template>
  <div class="checkout-result">
    <div class="checkout-result__card" :class="info.tone">
      <h1>{{ info.title }}</h1>
      <p>{{ info.message }}</p>
      <div class="checkout-result__actions">
        <NuxtLink
          v-for="action in info.actions"
          :key="action.to"
          :to="action.to"
          class="btn"
          :class="action.variant"
        >
          {{ action.label }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-result {
  min-height: calc(100vh - 8rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}
.checkout-result__card {
  max-width: 420px;
  width: 100%;
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-card);
}
.checkout-result__card.is-success { border-top-color: var(--color-success); }
.checkout-result__card.is-pending { border-top-color: var(--color-service); }
.checkout-result__card.is-failure { border-top-color: var(--color-danger); }

.checkout-result__card h1 {
  font-size: 1.4rem;
  margin-bottom: 0.6rem;
}
.checkout-result__card p {
  color: var(--color-ink-muted);
  margin: 0 0 1.5rem;
}
.checkout-result__actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
</style>
