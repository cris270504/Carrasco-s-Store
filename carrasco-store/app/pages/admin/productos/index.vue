<script setup lang="ts">
import type { AdminProductListItem } from '../../../types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: products, refresh } = await useFetch<AdminProductListItem[]>('/api/admin/products', {
  default: () => [],
})

const typeLabels = { physical: 'Físico', digital: 'Digital', service: 'Servicio' } as const
const typeFilter = ref<'all' | 'physical' | 'digital' | 'service'>('all')
const search = ref('')
const deletingId = ref<string | null>(null)

const confirmDialog = useConfirm()
const toast = useToast()

const filtered = computed(() => (products.value ?? []).filter((p) => {
  const matchesType = typeFilter.value === 'all' || p.type === typeFilter.value
  const matchesSearch = p.name.toLowerCase().includes(search.value.toLowerCase())
  return matchesType && matchesSearch
}))

async function handleDelete(product: AdminProductListItem) {
  const confirmed = await confirmDialog(product.hasSales
    ? {
        title: 'Desactivar producto',
        message: `"${product.name}" tiene ventas registradas, así que se desactivará en vez de eliminarse: dejará de mostrarse en el catálogo pero se conserva su historial de órdenes. Podrás reactivarlo después desde su edición.`,
        confirmLabel: 'Desactivar',
        variant: 'danger',
      }
    : {
        title: 'Eliminar producto',
        message: `"${product.name}" no tiene ventas registradas, así que se eliminará de forma permanente junto con sus variantes e imágenes. Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        variant: 'danger',
      })
  if (!confirmed) return

  deletingId.value = product.id
  try {
    const result = await $fetch<{ success: true, mode: 'disabled' | 'deleted' }>(
      `/api/admin/products/${product.id}`,
      { method: 'DELETE' },
    )
    await refresh()
    toast.success(result.mode === 'deleted'
      ? `"${product.name}" fue eliminado permanentemente.`
      : `"${product.name}" fue desactivado.`)
  }
  catch {
    toast.error('No se pudo completar la acción. Intenta de nuevo.')
  }
  finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="products-page">
    <header class="page-header">
      <div>
        <p class="page-header__eyebrow">Catálogo</p>
        <h1>Productos</h1>
      </div>
      <NuxtLink to="/admin/productos/nuevo" class="btn btn-primary">+ Nuevo producto</NuxtLink>
    </header>

    <div class="toolbar">
      <div class="toolbar__tabs">
        <button
          v-for="opt in [{ v: 'all', l: 'Todos' }, { v: 'physical', l: 'Físicos' }, { v: 'digital', l: 'Digitales' }, { v: 'service', l: 'Servicios' }]"
          :key="opt.v"
          type="button"
          class="toolbar__tab"
          :class="{ 'is-active': typeFilter === opt.v }"
          @click="typeFilter = opt.v as typeof typeFilter"
        >
          {{ opt.l }}
        </button>
      </div>
      <input v-model="search" type="text" placeholder="Buscar producto..." class="toolbar__search">
    </div>

    <div class="panel">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Marca</th>
            <th>Precio</th>
            <th>Detalle</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filtered" :key="product.id">
            <td>
              <img v-if="product.image" :src="product.image" alt="" class="products-page__thumb">
              <div v-else class="products-page__thumb products-page__thumb--empty" aria-hidden="true" />
            </td>
            <td class="products-page__name">{{ product.name }}</td>
            <td><span class="type-badge" :class="`is-${product.type}`">{{ typeLabels[product.type] }}</span></td>
            <td>{{ product.brand ?? '—' }}</td>
            <td class="admin-table__mono">S/ {{ Number(product.price).toFixed(2) }}</td>
            <td class="products-page__detail">{{ product.detail }}</td>
            <td>
              <span class="status-dot" :class="{ 'is-active': product.isActive }" />
              {{ product.isActive ? 'Activo' : 'Inactivo' }}
              <span v-if="product.hasSales" class="sales-badge" title="Tiene ventas registradas">Con ventas</span>
            </td>
            <td class="products-page__actions">
              <NuxtLink :to="`/admin/productos/${product.id}/editar`" class="icon-btn" aria-label="Editar">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M13.5 3.5 16.5 6.5 6.5 16.5H3.5V13.5L13.5 3.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                </svg>
              </NuxtLink>
              <button
                type="button"
                class="icon-btn is-danger"
                :aria-label="product.hasSales ? 'Desactivar' : 'Eliminar'"
                :title="product.hasSales ? 'Desactivar (tiene ventas registradas)' : 'Eliminar permanentemente'"
                :disabled="deletingId === product.id"
                @click="handleDelete(product)"
              >
                <svg v-if="product.hasSales" width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10C3.5 6.5 6.5 4.5 10 4.5s6.5 2 8 5.5c-1.5 3.5-4.5 5.5-8 5.5s-6.5-2-8-5.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                  <circle cx="10" cy="10" r="2.2" stroke="currentColor" stroke-width="1.4" />
                  <path d="M3.5 3.5l13 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M4 6h12M8 6V4h4v2M6 6l.6 10h6.8L14 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="8" class="products-page__empty">Sin resultados para este filtro.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
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
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.toolbar__tabs {
  display: flex;
  gap: 0.4rem;
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
.toolbar__search {
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
  min-width: 220px;
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

.products-page__thumb {
  display: block;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-control);
  object-fit: cover;
  border: 1px solid var(--color-border);
}
.products-page__thumb--empty {
  background: var(--color-bg);
}

.products-page__name {
  font-weight: 600;
  white-space: normal;
  min-width: 180px;
}
.products-page__detail {
  color: var(--color-ink-muted);
  font-size: 0.82rem;
}
.products-page__empty {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 2rem;
}
.products-page__actions {
  display: flex;
  gap: 0.4rem;
}

.type-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}
.type-badge.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.type-badge.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }
.type-badge.is-service { background: var(--color-service-tint); color: var(--color-service-ink); }

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-ink-faint);
  margin-right: 0.35rem;
}
.status-dot.is-active {
  background: var(--color-success);
}

.sales-badge {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  white-space: nowrap;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
}
.icon-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.icon-btn.is-danger:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>
