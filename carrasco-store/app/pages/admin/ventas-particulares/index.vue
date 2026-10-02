<script setup lang="ts">
import { calculateMargin } from '#shared/utils/margin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface ManualSale {
  id: string
  description: string
  customerName: string | null
  supplier: string | null
  quantity: number
  unitPrice: string
  unitCost: string
  channel: string
  notes: string | null
  soldAt: string
  revenue: number
  profit: number
}
interface CatalogProduct { id: string, name: string, price: string, costPrice: string | null }
interface Supplier { id: string, name: string }

const toast = useToast()
const confirmDialog = useConfirm()

const { data: sales, refresh } = await useFetch<ManualSale[]>('/api/admin/manual-sales', { default: () => [] })
const { data: products } = await useFetch<CatalogProduct[]>('/api/admin/costs', { default: () => [] })
const { data: suppliers } = await useFetch<Supplier[]>('/api/admin/suppliers', { default: () => [] })
const { settings, ensureSettings } = useStoreSettings()
await ensureSettings()

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp', presencial: 'Presencial', redes: 'Redes', otro: 'Otro',
}

const form = reactive({
  productId: '',
  description: '',
  supplierId: '',
  customerName: '',
  quantity: 1,
  unitPrice: '',
  unitCost: '',
  channel: 'whatsapp',
  soldAt: new Date().toISOString().slice(0, 10),
  notes: '',
})

// Al elegir un producto del catálogo, precarga precio/costo/proveedor (editables).
watch(() => form.productId, (id) => {
  const p = products.value?.find(x => x.id === id)
  if (!p) return
  form.description = p.name
  form.unitPrice = p.price
  form.unitCost = p.costPrice ?? ''
})

const liveProfit = computed(() => {
  const price = Number(form.unitPrice)
  const cost = Number(form.unitCost || 0)
  if (!Number.isFinite(price)) return null
  return calculateMargin(price, cost, form.quantity)
})

const submitting = ref(false)
async function submit() {
  if (submitting.value) return
  if (!form.productId && !form.description.trim()) {
    toast.error('Elige un producto o escribe qué se vendió.')
    return
  }
  if (!Number(form.unitPrice)) {
    toast.error('Ingresa el precio de venta.')
    return
  }
  submitting.value = true
  try {
    await $fetch('/api/admin/manual-sales', {
      method: 'POST',
      body: {
        productId: form.productId || undefined,
        description: form.description.trim() || undefined,
        supplierId: form.supplierId || undefined,
        customerName: form.customerName.trim() || undefined,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        unitCost: form.unitCost || 0,
        channel: form.channel,
        soldAt: form.soldAt,
        notes: form.notes.trim() || undefined,
      },
    })
    toast.success('Venta registrada.')
    Object.assign(form, {
      productId: '', description: '', supplierId: '', customerName: '',
      quantity: 1, unitPrice: '', unitCost: '', channel: 'whatsapp',
      soldAt: new Date().toISOString().slice(0, 10), notes: '',
    })
    await refresh()
  }
  catch (err) {
    toast.error((err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'No se pudo registrar.')
  }
  finally {
    submitting.value = false
  }
}

async function remove(sale: ManualSale) {
  const ok = await confirmDialog({
    title: 'Eliminar venta',
    message: `Se eliminará el registro de "${sale.description}". Esto no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await $fetch(`/api/admin/manual-sales/${sale.id}`, { method: 'DELETE' })
    toast.success('Venta eliminada.')
    await refresh()
  }
  catch {
    toast.error('No se pudo eliminar.')
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="ms-page">
    <header class="page-header">
      <p class="page-header__eyebrow">Fuera de la tienda</p>
      <h1>Ventas particulares</h1>
    </header>

    <form class="panel ms-form" @submit.prevent="submit">
      <h2>Registrar venta</h2>
      <div class="ms-form__grid">
        <label class="field">
          <span>Producto del catálogo</span>
          <select v-model="form.productId">
            <option value="">— Otro (escribir abajo) —</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>Descripción {{ form.productId ? '(del producto)' : '' }}</span>
          <input v-model="form.description" type="text" :disabled="!!form.productId" placeholder="Ej. Licencia Office 2019">
        </label>
        <label class="field">
          <span>Cliente (opcional)</span>
          <input v-model="form.customerName" type="text" placeholder="Nombre o referencia">
        </label>
        <label class="field">
          <span>Canal</span>
          <select v-model="form.channel">
            <option v-for="(l, v) in channelLabels" :key="v" :value="v">{{ l }}</option>
          </select>
        </label>
        <label class="field">
          <span>Cantidad</span>
          <input v-model.number="form.quantity" type="number" min="1" step="1">
        </label>
        <label class="field">
          <span>Precio de venta (unit.)</span>
          <input v-model="form.unitPrice" type="number" min="0.01" step="0.01" required>
        </label>
        <label class="field">
          <span>Costo de compra (unit.)</span>
          <input v-model="form.unitCost" type="number" min="0" step="0.01" placeholder="0.00">
        </label>
        <label class="field">
          <span>Proveedor (opcional)</span>
          <select v-model="form.supplierId">
            <option value="">Sin proveedor</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>Fecha</span>
          <input v-model="form.soldAt" type="date">
        </label>
        <label class="field ms-form__notes">
          <span>Notas (opcional)</span>
          <input v-model="form.notes" type="text">
        </label>
      </div>

      <div class="ms-form__foot">
        <span v-if="liveProfit !== null" class="ms-form__profit">
          Ganancia: <strong :class="liveProfit >= 0 ? 'is-gain' : 'is-loss'">{{ formatMoney(liveProfit, settings?.currencyCode) }}</strong>
        </span>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? 'Registrando…' : 'Registrar venta' }}
        </button>
      </div>
    </form>

    <div class="panel">
      <h2>Historial</h2>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Cliente</th>
            <th>Canal</th>
            <th>Cant.</th>
            <th>Venta</th>
            <th>Ganancia</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sales" :key="s.id">
            <td class="ms-page__muted">{{ formatDate(s.soldAt) }}</td>
            <td class="ms-page__name">{{ s.description }}</td>
            <td class="ms-page__muted">{{ s.customerName || '—' }}</td>
            <td class="ms-page__muted">{{ channelLabels[s.channel] ?? s.channel }}</td>
            <td class="admin-table__mono">{{ s.quantity }}</td>
            <td class="admin-table__mono">{{ formatMoney(s.revenue, settings?.currencyCode) }}</td>
            <td class="admin-table__mono">
              <span :class="s.profit >= 0 ? 'is-gain' : 'is-loss'">{{ formatMoney(s.profit, settings?.currencyCode) }}</span>
            </td>
            <td>
              <button type="button" class="btn btn-outline ms-page__del" @click="remove(s)">Eliminar</button>
            </td>
          </tr>
          <tr v-if="!sales?.length">
            <td colspan="8" class="ms-page__empty">Todavía no hay ventas registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>
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
  margin-bottom: 0.9rem;
}

.ms-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.field span {
  font-size: 0.78rem;
  color: var(--color-ink-muted);
}
.field input,
.field select {
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
}
.field input:disabled {
  opacity: 0.6;
}
.ms-form__notes {
  grid-column: 1 / -1;
}
.ms-form__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.ms-form__profit {
  font-size: 0.88rem;
  color: var(--color-ink-muted);
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
  padding: 0.65rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.admin-table tr:last-child td { border-bottom: none; }
.admin-table__mono { font-family: var(--font-mono); white-space: nowrap; }

.is-gain { color: var(--color-success); font-weight: 700; }
.is-loss { color: var(--color-danger); font-weight: 700; }
.ms-page__name { font-weight: 600; min-width: 160px; }
.ms-page__muted { color: var(--color-ink-muted); white-space: nowrap; }
.ms-page__empty { text-align: center; color: var(--color-ink-muted); padding: 2rem; }
.ms-page__del {
  font-size: 0.76rem;
  padding: 0.35rem 0.7rem;
  white-space: nowrap;
}
</style>
