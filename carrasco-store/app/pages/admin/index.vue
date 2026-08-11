<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

// TODO: reemplazar por GET /api/admin/metrics cuando exista el endpoint.
const metrics = [
  { label: 'Ventas del mes', value: 'S/ 12,480.00', change: '+18%', trend: 'up', icon: 'sales' },
  { label: 'Pedidos pendientes', value: '7', change: '2 nuevos hoy', trend: 'neutral', icon: 'orders' },
  { label: 'Productos activos', value: '48', change: '3 sin stock', trend: 'down', icon: 'box' },
  { label: 'Clientes nuevos', value: '15', change: '+6 esta semana', trend: 'up', icon: 'users' },
] as const

const recentOrders = [
  { id: '195EB1A3', customer: 'Cristopher Carrasco', total: 605.00, status: 'pending_payment' },
  { id: 'FD6474AB', customer: 'Ana Torres', total: 310.00, status: 'paid' },
  { id: '9C21F0E4', customer: 'Luis Ramírez', total: 89.90, status: 'shipped' },
  { id: '7B8A6D12', customer: 'María Quispe', total: 1250.00, status: 'completed' },
] as const

const statusLabels: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  shipped: 'Enviado',
  completed: 'Completado',
}

const lowStock = [
  { name: 'Disco Duro Sólido 1TB', stock: 2 },
  { name: 'Licencia Antivirus Pro', stock: 1 },
  { name: 'Mouse Inalámbrico', stock: 0 },
] as const

const weeklySales = [40, 55, 35, 70, 62, 80, 58] as const
const maxSale = Math.max(...weeklySales)
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <p class="page-header__eyebrow">Panel interno</p>
      <h1>Dashboard</h1>
    </header>

    <section class="metrics-grid">
      <div v-for="metric in metrics" :key="metric.label" class="metric-card">
        <div class="metric-card__icon" :class="`is-${metric.icon}`">
          <svg v-if="metric.icon === 'sales'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M2 15 7 9l4 3 6-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M13 5h5v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else-if="metric.icon === 'orders'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M2 2h2l1.2 9.6A1.5 1.5 0 0 0 6.68 13h8.14a1.5 1.5 0 0 0 1.48-1.24L17.5 5H4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="7.5" cy="17" r="1.3" fill="currentColor" />
            <circle cx="14.5" cy="17" r="1.3" fill="currentColor" />
          </svg>
          <svg v-else-if="metric.icon === 'box'" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l9-4 9 4-9 4-9-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M3 8v8l9 4 9-4V8" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="7" cy="6.5" r="2.7" stroke="currentColor" stroke-width="1.5" />
            <path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <p class="metric-card__value">{{ metric.value }}</p>
        <p class="metric-card__label">{{ metric.label }}</p>
        <span class="metric-card__change" :class="`is-${metric.trend}`">{{ metric.change }}</span>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="panel">
        <div class="panel__header">
          <h2>Ventas de la semana</h2>
          <span class="panel__hint">Simulado</span>
        </div>
        <div class="bar-chart">
          <div v-for="(value, i) in weeklySales" :key="i" class="bar-chart__col">
            <div class="bar-chart__bar" :style="{ height: `${(value / maxSale) * 100}%` }" />
            <span>{{ ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i] }}</span>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header">
          <h2>Stock bajo</h2>
        </div>
        <ul class="stock-list">
          <li v-for="item in lowStock" :key="item.name">
            <span>{{ item.name }}</span>
            <span class="stock-list__badge" :class="{ 'is-empty': item.stock === 0 }">
              {{ item.stock === 0 ? 'Agotado' : `${item.stock} u.` }}
            </span>
          </li>
        </ul>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <h2>Pedidos recientes</h2>
        <NuxtLink to="/admin/ordenes" class="panel__link">Ver todos →</NuxtLink>
      </div>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in recentOrders" :key="order.id">
            <td class="admin-table__mono">#{{ order.id }}</td>
            <td>{{ order.customer }}</td>
            <td class="admin-table__mono">S/ {{ order.total.toFixed(2) }}</td>
            <td><span class="status-badge" :class="`is-${order.status}`">{{ statusLabels[order.status] }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.metric-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.1rem;
}
.metric-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  margin-bottom: 0.7rem;
  color: var(--color-accent);
  background: var(--color-accent-tint);
}
.metric-card__value {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.35rem;
  margin: 0;
}
.metric-card__label {
  color: var(--color-ink-muted);
  font-size: 0.82rem;
  margin: 0.15rem 0 0.5rem;
}
.metric-card__change {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--color-border);
  color: var(--color-ink-muted);
}
.metric-card__change.is-up {
  background: var(--color-physical-tint);
  color: var(--color-physical-ink);
}
.metric-card__change.is-down {
  background: var(--color-danger-tint);
  color: var(--color-danger);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.25rem;
  margin-bottom: 1rem;
}
.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.panel__header h2 {
  font-size: 0.98rem;
}
.panel__hint {
  font-size: 0.72rem;
  color: var(--color-ink-faint);
}
.panel__link {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  height: 150px;
}
.bar-chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  height: 100%;
}
.bar-chart__bar {
  width: 100%;
  border-radius: 5px 5px 0 0;
  background: var(--color-accent);
  min-height: 4px;
}
.bar-chart__col span {
  font-size: 0.72rem;
  color: var(--color-ink-faint);
}

.stock-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.stock-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
}
.stock-list__badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--color-service-tint);
  color: var(--color-service-ink);
}
.stock-list__badge.is-empty {
  background: var(--color-danger-tint);
  color: var(--color-danger);
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
  padding: 0 0.5rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.admin-table td {
  padding: 0.7rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
}
.admin-table tr:last-child td {
  border-bottom: none;
}
.admin-table__mono {
  font-family: var(--font-mono);
}

.status-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  white-space: nowrap;
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
.status-badge.is-cancelled,
.status-badge.is-refunded {
  background: var(--color-danger-tint);
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
