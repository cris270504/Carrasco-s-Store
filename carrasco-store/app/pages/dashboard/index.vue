<script setup lang="ts">
import type { Order } from '~/types/order'

definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const displayName = computed(() => {
  return (user.value?.user_metadata as { full_name?: string } | undefined)?.full_name
    || user.value?.email
    || 'Cliente'
})

const { data: orders, pending, error } = await useFetch<Order[]>('/api/orders')
const { settings, ensureSettings } = useStoreSettings()
await ensureSettings()

const orderStatusLabels: Record<Order['status'], string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  processing: 'En proceso',
  shipped: 'Enviado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

const bookingStatusLabels: Record<string, string> = {
  pending: 'Pendiente de coordinar',
  confirmed: 'Confirmado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const licenseStatusLabels: Record<string, string> = {
  available: 'Preparando entrega',
  reserved: 'Preparando entrega',
  delivered: 'Entregada',
}

const digitalItems = computed(() =>
  (orders.value ?? []).flatMap(order =>
    order.items
      .filter(item => item.itemType === 'digital')
      .map(item => ({ ...item, orderDate: order.createdAt })),
  ),
)

const serviceItems = computed(() =>
  (orders.value ?? []).flatMap(order =>
    order.items
      .filter(item => item.itemType === 'service')
      .map(item => ({ ...item, orderDate: order.createdAt })),
  ),
)

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const loggingOut = ref(false)

async function handleLogout() {
  loggingOut.value = true
  await supabase.auth.signOut()
  await navigateTo('/login')
}
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

    <div v-if="pending" class="dashboard__state">Cargando tu información…</div>
    <div v-else-if="error" class="dashboard__state">No pudimos cargar tu panel. Intenta recargar la página.</div>

    <div v-else class="dashboard__grid">
      <section class="dashboard-card">
        <h2>Pedidos y envíos</h2>
        <div v-if="orders?.length" class="order-list">
          <div v-for="order in orders" :key="order.id" class="order-row">
            <div class="order-row__info">
              <span class="order-row__id">#{{ order.id.slice(0, 8).toUpperCase() }}</span>
              <span class="order-row__date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <span class="order-row__status" :class="`is-${order.status}`">{{ orderStatusLabels[order.status] }}</span>
            <span class="order-row__total">{{ formatMoney(Number(order.total), settings?.currencyCode) }}</span>
          </div>
        </div>
        <div v-else class="dashboard-card__empty">
          <p>Aún no tienes pedidos.</p>
          <NuxtLink to="/catalogo" class="btn btn-outline">Ir al catálogo</NuxtLink>
        </div>
      </section>

      <section class="dashboard-card">
        <h2>Licencias digitales</h2>
        <div v-if="digitalItems.length" class="order-list">
          <div v-for="item in digitalItems" :key="item.id" class="order-row">
            <div class="order-row__info">
              <span class="order-row__id">{{ item.product.name }}</span>
              <span class="order-row__date">{{ formatDate(item.orderDate) }}</span>
            </div>
            <span class="order-row__status">{{ item.license ? licenseStatusLabels[item.license.status] : 'Preparando entrega' }}</span>
            <code v-if="item.license?.status === 'delivered'" class="order-row__code">{{ item.license.code }}</code>
          </div>
        </div>
        <div v-else class="dashboard-card__empty">
          <p>Tus códigos y licencias compradas aparecerán aquí.</p>
          <NuxtLink to="/catalogo?type=digital" class="btn btn-outline">Ver licencias</NuxtLink>
        </div>
      </section>

      <section class="dashboard-card">
        <h2>Servicios agendados</h2>
        <div v-if="serviceItems.length" class="order-list">
          <div v-for="item in serviceItems" :key="item.id" class="order-row">
            <div class="order-row__info">
              <span class="order-row__id">{{ item.product.name }}</span>
              <span class="order-row__date">{{ formatDate(item.orderDate) }}</span>
            </div>
            <span class="order-row__status">
              {{ item.booking ? bookingStatusLabels[item.booking.status] : 'Pendiente de coordinar' }}
            </span>
          </div>
        </div>
        <div v-else class="dashboard-card__empty">
          <p>No tienes servicios técnicos programados.</p>
          <NuxtLink to="/catalogo?type=service" class="btn btn-outline">Ver servicios</NuxtLink>
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
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-border-strong);
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
.dashboard__state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-ink-muted);
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.1rem;
  align-items: start;
}
.dashboard-card {
  background: var(--color-surface);
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}
.dashboard-card h2 {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.9rem;
}
.dashboard-card__empty {
  text-align: center;
  padding: 1.75rem 1rem;
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-card);
}
.dashboard-card__empty p {
  color: var(--color-ink-muted);
  font-size: 0.85rem;
  margin: 0 0 0.9rem;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.order-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  flex-wrap: wrap;
}
.order-row__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.order-row__id {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-row__date {
  font-size: 0.72rem;
  color: var(--color-ink-faint);
}
.order-row__status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  white-space: nowrap;
}
.order-row__status.is-paid,
.order-row__status.is-completed {
  background: var(--color-physical-tint);
  color: var(--color-physical-ink);
}
.order-row__status.is-shipped {
  background: var(--color-digital-tint);
  color: var(--color-digital-ink);
}
.order-row__status.is-pending_payment {
  background: var(--color-service-tint);
  color: var(--color-service-ink);
}
.order-row__status.is-cancelled,
.order-row__status.is-refunded {
  background: var(--color-danger-tint);
  color: var(--color-danger);
}
.order-row__total {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.85rem;
}
.order-row__code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  background: var(--color-accent-tint);
  color: var(--color-accent-hover);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}
</style>
