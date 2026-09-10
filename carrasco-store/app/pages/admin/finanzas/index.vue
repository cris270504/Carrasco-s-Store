<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface Bucket { revenue: number, cost: number, profit: number, store: number, manual: number }
interface FinanceData {
  summary: {
    today: Bucket
    week: Bucket
    month: Bucket
    lastMonth: Bucket
    storeLinesWithoutCost: number
  }
  profitChangePct: number | null
  daily: (Bucket & { date: string })[]
  monthly: (Bucket & { month: string })[]
}

const { data, pending } = await useFetch<FinanceData>('/api/admin/finance')

function money(n: number) {
  return `S/ ${n.toFixed(2)}`
}

const summaryCards = computed(() => {
  const s = data.value?.summary
  if (!s) return []
  return [
    { key: 'today', label: 'Hoy', bucket: s.today },
    { key: 'week', label: 'Esta semana', bucket: s.week },
    { key: 'month', label: 'Este mes', bucket: s.month },
  ]
})

const maxDailyProfit = computed(() => Math.max(1, ...(data.value?.daily ?? []).map(d => Math.max(0, d.profit))))
const maxMonthlyProfit = computed(() => Math.max(1, ...(data.value?.monthly ?? []).map(d => Math.max(0, d.profit))))

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
function monthLabel(key: string) {
  const [, m] = key.split('-')
  return monthNames[Number(m) - 1]
}
function dayLabel(key: string) {
  return key.slice(8)
}
</script>

<template>
  <div class="fin-page">
    <header class="page-header">
      <p class="page-header__eyebrow">Panel interno</p>
      <h1>Finanzas</h1>
    </header>

    <p v-if="pending" class="fin-page__state">Cargando finanzas…</p>

    <template v-else-if="data">
      <p v-if="data.summary.storeLinesWithoutCost > 0" class="fin-page__note">
        {{ data.summary.storeLinesWithoutCost }} línea(s) de venta de la tienda todavía sin costo cargado
        (ventas previas a esta función): su ganancia está sobreestimada. Se corrige solo en las ventas nuevas.
      </p>

      <section class="fin-cards">
        <div v-for="card in summaryCards" :key="card.key" class="fin-card">
          <p class="fin-card__label">{{ card.label }}</p>
          <p class="fin-card__profit">{{ money(card.bucket.profit) }}</p>
          <p class="fin-card__sub">ganancia</p>
          <div class="fin-card__detail">
            <span>Ingreso {{ money(card.bucket.revenue) }}</span>
            <span>Costo {{ money(card.bucket.cost) }}</span>
          </div>
          <p class="fin-card__count">
            {{ card.bucket.store }} tienda · {{ card.bucket.manual }} particulares
          </p>
          <span
            v-if="card.key === 'month' && data.profitChangePct !== null"
            class="fin-card__change"
            :class="data.profitChangePct >= 0 ? 'is-up' : 'is-down'"
          >
            {{ data.profitChangePct >= 0 ? '+' : '' }}{{ data.profitChangePct }}% vs mes anterior
          </span>
        </div>
      </section>

      <section class="panel">
        <h2>Ganancia diaria — últimos 30 días</h2>
        <div class="bar-chart">
          <div v-for="d in data.daily" :key="d.date" class="bar-chart__col" :title="`${d.date}: ${money(d.profit)}`">
            <div class="bar-chart__bar" :style="{ height: `${Math.max(2, (Math.max(0, d.profit) / maxDailyProfit) * 100)}%` }" />
            <span class="bar-chart__tick">{{ dayLabel(d.date) }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>Resumen mensual — últimos 12 meses</h2>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Ingreso</th>
              <th>Costo</th>
              <th>Ganancia</th>
              <th>Ventas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in [...data.monthly].reverse()" :key="m.month">
              <td>{{ monthLabel(m.month) }} {{ m.month.slice(0, 4) }}</td>
              <td class="admin-table__mono">{{ money(m.revenue) }}</td>
              <td class="admin-table__mono">{{ money(m.cost) }}</td>
              <td class="admin-table__mono">
                <strong :class="m.profit >= 0 ? 'is-gain' : 'is-loss'">{{ money(m.profit) }}</strong>
              </td>
              <td class="fin-page__muted">{{ m.store + m.manual }}</td>
              <td class="fin-page__barcell">
                <div class="fin-page__minibar" :style="{ width: `${(Math.max(0, m.profit) / maxMonthlyProfit) * 100}%` }" />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.page-header__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.25rem;
}
.page-header h1 { font-size: 1.5rem; }
.fin-page__state { color: var(--color-ink-muted); padding: 2rem 0; }

.fin-page__note {
  font-size: 0.82rem;
  color: var(--color-service-ink);
  background: var(--color-service-tint);
  border-radius: var(--radius-control);
  padding: 0.7rem 0.9rem;
  margin-bottom: 1.25rem;
}

.fin-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.fin-card {
  position: relative;
  background: var(--color-surface);
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 1.1rem;
}
.fin-card__label {
  font-size: 0.78rem;
  color: var(--color-ink-muted);
  margin: 0 0 0.35rem;
}
.fin-card__profit {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.35rem;
  margin: 0;
}
.fin-card__sub {
  font-size: 0.72rem;
  color: var(--color-ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 0.6rem;
}
.fin-card__detail {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.78rem;
  color: var(--color-ink-muted);
}
.fin-card__count {
  font-size: 0.74rem;
  color: var(--color-ink-faint);
  margin: 0.5rem 0 0;
}
.fin-card__change {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.74rem;
  font-weight: 600;
}
.fin-card__change.is-up { color: var(--color-success); }
.fin-card__change.is-down { color: var(--color-danger); }

.panel {
  background: var(--color-surface);
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 1.1rem;
  overflow-x: auto;
  margin-bottom: 1.25rem;
}
.panel h2 {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 160px;
  min-width: 520px;
}
.bar-chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 0.3rem;
}
.bar-chart__bar {
  width: 100%;
  background: var(--color-accent);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}
.bar-chart__tick {
  font-size: 0.6rem;
  color: var(--color-ink-faint);
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
  padding: 0.6rem;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.admin-table tr:last-child td { border-bottom: none; }
.admin-table__mono { font-family: var(--font-mono); }
.is-gain { color: var(--color-success); }
.is-loss { color: var(--color-danger); }
.fin-page__muted { color: var(--color-ink-muted); }
.fin-page__barcell { width: 120px; }
.fin-page__minibar {
  height: 8px;
  background: var(--color-accent-tint);
  border-radius: 999px;
  min-width: 2px;
}
</style>
