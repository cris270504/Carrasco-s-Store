<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const displayName = computed(() => {
  return (user.value?.user_metadata as { full_name?: string } | undefined)?.full_name
    || user.value?.email
    || 'Cliente'
})

const loggingOut = ref(false)

async function handleLogout() {
  loggingOut.value = true
  await supabase.auth.signOut()
  await navigateTo('/login')
}

// TODO(Parte 5 - Panel de cliente): reemplazar por datos reales de
// GET /api/orders, /api/licenses y /api/bookings cuando existan.
const sections = [
  {
    key: 'orders',
    title: 'Pedidos y envíos',
    empty: 'Aún no tienes pedidos físicos en camino.',
  },
  {
    key: 'licenses',
    title: 'Licencias digitales',
    empty: 'Tus códigos y licencias compradas aparecerán aquí.',
  },
  {
    key: 'bookings',
    title: 'Servicios agendados',
    empty: 'No tienes servicios técnicos programados.',
  },
] as const
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <div>
        <p class="dashboard__eyebrow">Panel de cliente</p>
        <h1>Hola, {{ displayName }}</h1>
      </div>
      <button type="button" class="btn btn-outline" :disabled="loggingOut" @click="handleLogout">
        {{ loggingOut ? 'Saliendo…' : 'Cerrar sesión' }}
      </button>
    </header>

    <div class="dashboard__grid">
      <section v-for="section in sections" :key="section.key" class="dashboard-card">
        <h2>{{ section.title }}</h2>
        <div class="dashboard-card__empty">
          <p>{{ section.empty }}</p>
          <NuxtLink to="/catalogo" class="btn btn-outline">Ir al catálogo</NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 3rem;
}
.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}
.dashboard__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.3rem;
}
.dashboard__header h1 {
  font-size: 1.6rem;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.1rem;
}
.dashboard-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.25rem;
}
.dashboard-card h2 {
  font-size: 1rem;
  margin-bottom: 0.9rem;
}
.dashboard-card__empty {
  text-align: center;
  padding: 1.75rem 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-control);
}
.dashboard-card__empty p {
  color: var(--color-ink-muted);
  font-size: 0.85rem;
  margin: 0 0 0.9rem;
}
</style>
