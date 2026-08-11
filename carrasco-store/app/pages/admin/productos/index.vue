<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface AdminProduct {
  id: string
  name: string
  type: 'physical' | 'digital' | 'service'
  brand: string | null
  price: number
  detail: string
  isActive: boolean
}

// TODO: reemplazar por datos reales cuando exista GET /api/admin/products.
const { data: fetchedProducts } = await useFetch<AdminProduct[]>('/api/admin/products', {
  default: () => [],
})

const mockProducts: AdminProduct[] = [
  { id: '1a645220', name: 'Disco Duro Sólido 1TB', type: 'physical', brand: 'Seagate', price: 250, detail: '15 en stock', isActive: true },
  { id: '2b756331', name: 'Mouse Inalámbrico', type: 'physical', brand: 'Logitech', price: 89.90, detail: '0 en stock', isActive: false },
  { id: '3c867442', name: 'Licencia Antivirus Pro', type: 'digital', brand: null, price: 45, detail: '1 licencia disponible', isActive: true },
  { id: '4d978553', name: 'Suite Ofimática 2026', type: 'digital', brand: null, price: 120, detail: '8 licencias disponibles', isActive: true },
  { id: '544dd420', name: 'Formateo e Instalación de SO', type: 'service', brand: null, price: 70, detail: '60 min · Remoto', isActive: true },
  { id: '5e089664', name: 'Diagnóstico y Limpieza PC', type: 'service', brand: null, price: 55, detail: '45 min · Presencial', isActive: true },
]

const products = computed(() => fetchedProducts.value?.length ? fetchedProducts.value : mockProducts)

const typeLabels = { physical: 'Físico', digital: 'Digital', service: 'Servicio' } as const
const typeFilter = ref<'all' | 'physical' | 'digital' | 'service'>('all')
const search = ref('')

const filtered = computed(() => products.value.filter((p) => {
  const matchesType = typeFilter.value === 'all' || p.type === typeFilter.value
  const matchesSearch = p.name.toLowerCase().includes(search.value.toLowerCase())
  return matchesType && matchesSearch
}))
</script>

<template>
  <div class="products-page">
    <header class="page-header">
      <div>
        <p class="page-header__eyebrow">Catálogo</p>
        <h1>Productos</h1>
      </div>
      <button type="button" class="btn btn-primary">+ Nuevo producto</button>
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
            <td class="products-page__name">{{ product.name }}</td>
            <td><span class="type-badge" :class="`is-${product.type}`">{{ typeLabels[product.type] }}</span></td>
            <td>{{ product.brand ?? '—' }}</td>
            <td class="admin-table__mono">S/ {{ product.price.toFixed(2) }}</td>
            <td class="products-page__detail">{{ product.detail }}</td>
            <td>
              <span class="status-dot" :class="{ 'is-active': product.isActive }" />
              {{ product.isActive ? 'Activo' : 'Inactivo' }}
            </td>
            <td class="products-page__actions">
              <button type="button" class="icon-btn" aria-label="Editar">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M13.5 3.5 16.5 6.5 6.5 16.5H3.5V13.5L13.5 3.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                </svg>
              </button>
              <button type="button" class="icon-btn is-danger" aria-label="Eliminar">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M4 6h12M8 6V4h4v2M6 6l.6 10h6.8L14 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" class="products-page__empty">Sin resultados para este filtro.</td>
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
