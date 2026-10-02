<script setup lang="ts">
import { calculateMargin } from '#shared/utils/margin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface CostRow {
  id: string
  name: string
  type: 'physical' | 'digital' | 'service'
  isActive: boolean | null
  price: string
  costPrice: string | null
  supplier: { id: string, name: string } | null
  costUpdatedAt: string | null
  margin: number | null
  marginPct: number | null
}
interface Supplier { id: string, name: string, productCount: number, manualSaleCount: number }
interface Draft { price: string, costPrice: string, supplierId: string }

const toast = useToast()

const { data: rows, refresh } = await useFetch<CostRow[]>('/api/admin/costs', { default: () => [] })
const { data: suppliers, refresh: refreshSuppliers } = await useFetch<Supplier[]>('/api/admin/suppliers', { default: () => [] })
const { settings, ensureSettings } = useStoreSettings()
await ensureSettings()

const typeLabels = { physical: 'Físico', digital: 'Digital', service: 'Servicio' }

// Borrador editable por fila (id -> campos). Se rehace cuando llegan datos
// nuevos del servidor.
const draft = reactive<Record<string, Draft>>({})
watchEffect(() => {
  for (const r of rows.value ?? []) {
    draft[r.id] = { price: r.price, costPrice: r.costPrice ?? '', supplierId: r.supplier?.id ?? '' }
  }
})

const editRows = computed(() => (rows.value ?? []).map((r) => {
  const d: Draft = draft[r.id] ?? { price: r.price, costPrice: r.costPrice ?? '', supplierId: r.supplier?.id ?? '' }
  const price = Number(d.price)
  const cost = d.costPrice === '' ? null : Number(d.costPrice)
  const liveMargin = (!Number.isFinite(price) || cost === null || !Number.isFinite(cost))
    ? null
    : calculateMargin(price, cost, 1)
  const dirty = d.price !== r.price
    || d.costPrice !== (r.costPrice ?? '')
    || d.supplierId !== (r.supplier?.id ?? '')
  return { row: r, d, liveMargin, dirty }
}))

const savingId = ref<string | null>(null)
async function saveRow(id: string) {
  const d = draft[id]
  if (!d || savingId.value) return
  savingId.value = id
  try {
    await $fetch(`/api/admin/costs/${id}`, {
      method: 'PATCH',
      body: {
        price: d.price,
        costPrice: d.costPrice === '' ? null : d.costPrice,
        supplierId: d.supplierId || null,
      },
    })
    toast.success('Producto actualizado.')
    await refresh()
  }
  catch (err) {
    toast.error((err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'No se pudo guardar.')
  }
  finally {
    savingId.value = null
  }
}

const newSupplier = ref('')
const addingSupplier = ref(false)
async function addSupplier() {
  const name = newSupplier.value.trim()
  if (!name || addingSupplier.value) return
  addingSupplier.value = true
  try {
    await $fetch('/api/admin/suppliers', { method: 'POST', body: { name } })
    newSupplier.value = ''
    toast.success('Proveedor agregado.')
    await refreshSuppliers()
  }
  catch (err) {
    toast.error((err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'No se pudo agregar.')
  }
  finally {
    addingSupplier.value = false
  }
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="costs-page">
    <header class="page-header">
      <p class="page-header__eyebrow">Márgenes</p>
      <h1>Costos y proveedores</h1>
    </header>

    <div class="panel costs-page__suppliers">
      <h2>Proveedores</h2>
      <ul class="supplier-list">
        <li v-for="s in suppliers" :key="s.id">
          {{ s.name }}
          <span class="supplier-list__count">{{ s.productCount }} prod · {{ s.manualSaleCount }} ventas</span>
        </li>
        <li v-if="!suppliers?.length" class="supplier-list__empty">Aún no hay proveedores.</li>
      </ul>
      <form class="supplier-add" @submit.prevent="addSupplier">
        <input v-model="newSupplier" type="text" placeholder="Nuevo proveedor…" maxlength="160">
        <button type="submit" class="btn btn-outline" :disabled="addingSupplier || !newSupplier.trim()">Agregar</button>
      </form>
    </div>

    <div class="panel">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio de compra</th>
            <th>Proveedor</th>
            <th>Precio de venta</th>
            <th>Ganancia</th>
            <th>Actualizado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="{ row: r, d, liveMargin, dirty } in editRows" :key="r.id" :class="{ 'is-inactive': !r.isActive }">
            <td class="costs-page__name">
              {{ r.name }}
              <span class="costs-page__type">{{ typeLabels[r.type] }}</span>
              <span v-if="!r.isActive" class="costs-page__badge">Inactivo</span>
            </td>
            <td>
              <input v-model="d.costPrice" type="number" step="0.01" min="0" class="costs-page__input" placeholder="—">
            </td>
            <td>
              <select v-model="d.supplierId" class="costs-page__input">
                <option value="">Sin proveedor</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </td>
            <td>
              <input v-model="d.price" type="number" step="0.01" min="0.01" class="costs-page__input">
            </td>
            <td class="admin-table__mono">
              <span v-if="liveMargin !== null" :class="liveMargin >= 0 ? 'costs-page__gain' : 'costs-page__loss'">
                {{ formatMoney(liveMargin, settings?.currencyCode) }}
                <template v-if="r.marginPct !== null && !dirty"> · {{ r.marginPct }}%</template>
              </span>
              <span v-else class="costs-page__muted">—</span>
            </td>
            <td class="costs-page__muted">{{ formatDate(r.costUpdatedAt) }}</td>
            <td>
              <button
                type="button"
                class="btn btn-primary costs-page__save"
                :disabled="!dirty || savingId === r.id"
                @click="saveRow(r.id)"
              >
                {{ savingId === r.id ? '…' : 'Guardar' }}
              </button>
            </td>
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
  margin-bottom: 0.8rem;
}

.costs-page__suppliers .supplier-list {
  list-style: none;
  margin: 0 0 0.9rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.supplier-list li {
  font-size: 0.82rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: 0.35rem 0.7rem;
}
.supplier-list__count {
  color: var(--color-ink-faint);
  margin-left: 0.4rem;
  font-size: 0.74rem;
}
.supplier-list__empty {
  color: var(--color-ink-muted);
}
.supplier-add {
  display: flex;
  gap: 0.5rem;
}
.supplier-add input {
  flex: 1;
  max-width: 320px;
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
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
  vertical-align: middle;
}
.admin-table tr:last-child td {
  border-bottom: none;
}
.admin-table__mono {
  font-family: var(--font-mono);
  white-space: nowrap;
}
.admin-table tr.is-inactive {
  opacity: 0.55;
}

.costs-page__name {
  font-weight: 600;
  min-width: 180px;
}
.costs-page__type {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-ink-faint);
  text-transform: uppercase;
}
.costs-page__badge {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.66rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--color-danger-tint);
  color: var(--color-danger);
}
.costs-page__input {
  width: 100%;
  min-width: 92px;
  max-width: 160px;
  font-family: var(--font-body);
  font-size: 0.84rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
}
.costs-page__gain { color: var(--color-success); font-weight: 700; }
.costs-page__loss { color: var(--color-danger); font-weight: 700; }
.costs-page__muted { color: var(--color-ink-muted); }
.costs-page__save {
  font-size: 0.78rem;
  padding: 0.4rem 0.8rem;
  white-space: nowrap;
}
</style>
