<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

type OrderStatus = 'pending_payment' | 'payment_in_progress' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded'

interface ShippingAddress {
  fullName: string
  line1: string
  line2: string | null
  city: string
  region: string | null
  phone: string | null
}

interface AdminOrder {
  id: string
  customer: string
  items: string
  hasPhysical: boolean
  shippingAddress: ShippingAddress | null
  total: number
  paymentStatus: string | null
  status: OrderStatus
  date: string
}

function addressSummary(address: ShippingAddress) {
  return `${address.fullName} — ${address.line1}, ${address.city}${address.phone ? ` · ${address.phone}` : ''}`
}

const toast = useToast()
const confirmDialog = useConfirm()
const { data: fetchedOrders, pending, refresh } = await useFetch<AdminOrder[]>('/api/admin/orders', {
  default: () => [],
})
const { settings, ensureSettings } = useStoreSettings()
await ensureSettings()

const orders = computed(() => fetchedOrders.value ?? [])
const updatingId = ref<string | null>(null)

async function markAsShipped(order: AdminOrder) {
  const confirmed = await confirmDialog({
    title: 'Marcar como enviado',
    message: `¿Confirmas que el pedido #${order.id.slice(0, 8).toUpperCase()} ya fue despachado?`,
    confirmLabel: 'Marcar enviado',
  })
  if (!confirmed) return

  updatingId.value = order.id
  try {
    await $fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status: 'shipped' } })
    await refresh()
    toast.success(`Orden #${order.id.slice(0, 8).toUpperCase()} marcada como enviada.`)
  }
  catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.error(fetchError?.data?.statusMessage || 'No se pudo actualizar la orden.')
  }
  finally {
    updatingId.value = null
  }
}

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  payment_in_progress: 'Pago en curso',
  paid: 'Pagado',
  processing: 'En proceso',
  shipped: 'Enviado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}
// Valores del `status` de la Orders API de Mercado Pago (Checkout API via
// Orders). Se cubren todos; el resto cae al fallback (texto crudo). Los cuatro
// ultimos son del flujo Checkout Pro anterior, para ordenes viejas.
const paymentLabels: Record<string, string> = {
  processed: 'Aprobado',
  failed: 'Rechazado',
  processing: 'En proceso',
  action_required: 'Requiere acción',
  in_review: 'En revisión',
  canceled: 'Cancelado',
  charged_back: 'Contracargo',
  expired: 'Expirado',
  created: 'Iniciado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  pending: 'Pendiente',
  in_process: 'En revisión',
}

function paymentLabel(status: string | null) {
  if (!status) return 'Sin registrar'
  return paymentLabels[status] ?? status
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function reconcile(order: AdminOrder) {
  updatingId.value = order.id
  try {
    const res = await $fetch<{ reconciled: boolean, reason?: string, status: string }>(
      `/api/admin/orders/${order.id}/reconcile`,
      { method: 'POST' },
    )
    await refresh()
    if (res.reconciled) {
      toast.success(`Orden #${order.id.slice(0, 8).toUpperCase()} conciliada: pago aprobado.`)
    }
    else {
      toast.info(res.reason || `Mercado Pago reporta el estado "${res.status}".`)
    }
  }
  catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.error(fetchError?.data?.statusMessage || 'No se pudo conciliar la orden.')
  }
  finally {
    updatingId.value = null
  }
}

const statusFilter = ref<'all' | OrderStatus>('all')
const filtered = computed(() =>
  orders.value.filter(o => statusFilter.value === 'all' || o.status === statusFilter.value),
)

const filterOptions = [
  { v: 'all', l: 'Todas' },
  { v: 'pending_payment', l: 'Pendientes' },
  { v: 'paid', l: 'Pagadas' },
  { v: 'shipped', l: 'Enviadas' },
  { v: 'completed', l: 'Completadas' },
  { v: 'cancelled', l: 'Canceladas' },
] as const
</script>

<template>
  <div class="orders-page">
    <header class="page-header">
      <p class="page-header__eyebrow">Ventas</p>
      <h1>Órdenes</h1>
    </header>

    <div class="toolbar">
      <button
        v-for="opt in filterOptions"
        :key="opt.v"
        type="button"
        class="toolbar__tab"
        :class="{ 'is-active': statusFilter === opt.v }"
        @click="statusFilter = opt.v"
      >
        {{ opt.l }}
      </button>
    </div>

    <div class="panel">
      <p v-if="pending" class="orders-page__empty">Cargando órdenes…</p>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Cliente</th>
            <th>Ítems</th>
            <th>Total</th>
            <th>Pago (Mercado Pago)</th>
            <th>Estado</th>
            <th>Envío</th>
            <th>Fecha</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filtered" :key="order.id">
            <td class="admin-table__mono">#{{ order.id.slice(0, 8).toUpperCase() }}</td>
            <td>{{ order.customer }}</td>
            <td class="orders-page__items">{{ order.items }}</td>
            <td class="admin-table__mono">{{ formatMoney(order.total, settings?.currencyCode) }}</td>
            <td><span class="payment-badge" :class="`is-${order.paymentStatus}`">{{ paymentLabel(order.paymentStatus) }}</span></td>
            <td><span class="status-badge" :class="`is-${order.status}`">{{ statusLabels[order.status] }}</span></td>
            <td class="orders-page__address">
              <span v-if="order.shippingAddress" :title="addressSummary(order.shippingAddress)">
                {{ order.shippingAddress.line1 }}, {{ order.shippingAddress.city }}
              </span>
              <span v-else-if="order.hasPhysical">—</span>
            </td>
            <td class="orders-page__date">{{ formatDate(order.date) }}</td>
            <td>
              <button
                v-if="order.hasPhysical && order.status === 'paid'"
                type="button"
                class="btn btn-outline orders-page__ship-btn"
                :disabled="updatingId === order.id"
                @click="markAsShipped(order)"
              >
                Marcar enviado
              </button>
              <button
                v-if="order.status === 'pending_payment' || order.status === 'payment_in_progress'"
                type="button"
                class="btn btn-outline orders-page__ship-btn"
                :disabled="updatingId === order.id"
                @click="reconcile(order)"
              >
                Conciliar con MP
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="9" class="orders-page__empty">Sin órdenes para este filtro.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}
.page-header__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.25rem;
}
.page-header h1 {
  font-size: 1.5rem;
}

.toolbar {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.toolbar__tab {
  font-family: var(--font-body);
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
}
.toolbar__tab.is-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.1rem;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.admin-table th {
  text-align: left;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ink-faint);
  padding: 0 0.6rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.admin-table td {
  padding: 0.75rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.admin-table tr:last-child td {
  border-bottom: none;
}
.admin-table__mono {
  font-family: var(--font-mono);
}

.orders-page__items {
  color: var(--color-ink-muted);
  white-space: normal;
  min-width: 160px;
}
.orders-page__date {
  color: var(--color-ink-faint);
  font-size: 0.8rem;
}
.orders-page__address {
  color: var(--color-ink-muted);
  font-size: 0.8rem;
  max-width: 180px;
  white-space: normal;
}
.orders-page__empty {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 2rem;
}
.orders-page__ship-btn {
  font-size: 0.78rem;
  padding: 0.4rem 0.75rem;
}

.payment-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}
.payment-badge.is-processed,
.payment-badge.is-approved { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.payment-badge.is-processing,
.payment-badge.is-action_required,
.payment-badge.is-in_review,
.payment-badge.is-created,
.payment-badge.is-pending { background: var(--color-service-tint); color: var(--color-service-ink); }
.payment-badge.is-failed,
.payment-badge.is-canceled,
.payment-badge.is-charged_back,
.payment-badge.is-expired,
.payment-badge.is-rejected { background: var(--color-danger-tint); color: var(--color-danger); }

.status-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--color-accent-tint);
  color: var(--color-accent);
}
.status-badge.is-paid,
.status-badge.is-completed {
  background: var(--color-physical-tint);
  color: var(--color-physical-ink);
}
.status-badge.is-shipped {
  background: var(--color-digital-tint);
  color: var(--color-digital-ink);
}
.status-badge.is-pending_payment {
  background: var(--color-service-tint);
  color: var(--color-service-ink);
}
.status-badge.is-cancelled,
.status-badge.is-refunded {
  background: var(--color-danger-tint);
  color: var(--color-danger);
}
</style>
