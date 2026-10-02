<script setup lang="ts">
import type { Product } from '~/types/product'

const { filters, resetFilters } = useProductFilters()
const { addItem } = useCart()
const toast = useToast()

const { data: products, pending, error, refresh } = await useFetch<Product[]>('/api/products', {
  query: filters,
})

// Orden y vista son puramente de presentación sobre los datos ya cargados:
// no disparan nuevas consultas al backend.
type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc'
const sortBy = ref<SortOption>('relevance')
const viewMode = ref<'grid' | 'list'>('grid')

const sortedProducts = computed(() => {
  const list = products.value ?? []
  const sorted = [...list]
  switch (sortBy.value) {
    case 'price_asc':
      return sorted.sort((a, b) => Number(a.price) - Number(b.price))
    case 'price_desc':
      return sorted.sort((a, b) => Number(b.price) - Number(a.price))
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted
  }
})

async function handleAddToCart(product: Product) {
  try {
    await addItem({
      productId: product.id,
      variantId: null,
      preferredModality: product.serviceDetail?.defaultModality ?? null,
    })
    toast.success(`"${product.name}" se agregó al carrito.`)
  }
  catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.error(fetchError?.data?.statusMessage || 'No se pudo agregar al carrito.')
  }
}

const catalogTypeLabels: Record<string, string> = {
  physical: 'Productos Físicos',
  digital: 'Licencias Digitales',
  service: 'Servicios Técnicos',
}

const seoTitle = computed(() => {
  const typeLabel = filters.type ? catalogTypeLabels[filters.type] : null
  return typeLabel ? `${typeLabel} — Catálogo — Carrasco Store` : 'Catálogo — Carrasco Store'
})

const seoDescription = computed(() => {
  const typeLabel = filters.type ? catalogTypeLabels[filters.type] : null
  return typeLabel
    ? `Explora ${typeLabel.toLowerCase()} en Carrasco Store: pago seguro y entrega según el ítem.`
    : 'Explora productos físicos, licencias digitales y servicios técnicos en Carrasco Store, con pago seguro vía Mercado Pago.'
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: computed(() => products.value?.[0]?.images?.[0]),
})
</script>

<template>
  <div class="catalog-page">
    <section class="catalog-hero">
      <p class="catalog-hero__eyebrow">Carrasco Store</p>
      <h1>Productos, licencias y servicios en un solo carrito</h1>
      <p class="catalog-hero__subtitle">Físico, digital y técnico — sin cambiar de tienda.</p>
    </section>

    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <NuxtLink to="/">Inicio</NuxtLink>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current">Catálogo</span>
    </nav>

    <div class="catalog">
      <ProductFilters :filters="filters" @reset="resetFilters" />

      <section class="catalog__results">
        <header class="catalog__toolbar">
          <p class="catalog__count">
            <template v-if="!pending && !error">
              {{ sortedProducts.length }} resultado{{ sortedProducts.length === 1 ? '' : 's' }}
            </template>
          </p>

          <div class="catalog__toolbar-actions">
            <div class="catalog__view-toggle" role="group" aria-label="Tipo de vista">
              <button
                type="button"
                class="catalog__view-btn"
                :class="{ 'is-active': viewMode === 'grid' }"
                aria-label="Vista de cuadrícula"
                :aria-pressed="viewMode === 'grid'"
                @click="viewMode = 'grid'"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
                  <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
                  <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
                  <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                class="catalog__view-btn"
                :class="{ 'is-active': viewMode === 'list' }"
                aria-label="Vista de lista"
                :aria-pressed="viewMode === 'list'"
                @click="viewMode = 'list'"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="2" width="14" height="3" rx="1" fill="currentColor" />
                  <rect x="1" y="7" width="14" height="3" rx="1" fill="currentColor" />
                  <rect x="1" y="12" width="14" height="3" rx="1" fill="currentColor" />
                </svg>
              </button>
            </div>

            <label class="catalog__sort">
              <span>Ordenar por</span>
              <select v-model="sortBy">
                <option value="relevance">Relevancia</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_asc">Nombre A-Z</option>
              </select>
            </label>
          </div>
        </header>

        <div v-if="pending" class="catalog__grid">
          <div v-for="n in 6" :key="n" class="skeleton-card">
            <div class="skeleton-card__image" />
            <div class="skeleton-card__line" style="width: 40%" />
            <div class="skeleton-card__line" style="width: 80%" />
            <div class="skeleton-card__line" style="width: 55%" />
          </div>
        </div>

        <div v-else-if="error" class="catalog__state">
          <p>No pudimos cargar el catálogo.</p>
          <button type="button" class="btn btn-outline" @click="refresh()">Reintentar</button>
        </div>

        <div v-else-if="sortedProducts.length === 0" class="catalog__state">
          <p class="catalog__state-title">Sin resultados para estos filtros</p>
          <p class="catalog__state-body">Prueba ajustando el tipo, la marca o el rango de precio.</p>
          <button type="button" class="btn btn-outline" @click="resetFilters">Limpiar filtros</button>
        </div>

        <div v-else class="catalog__grid" :class="`catalog__grid--${viewMode}`">
          <ProductCard
            v-for="product in sortedProducts"
            :key="product.id"
            :product="product"
            :view="viewMode"
            @add-to-cart="handleAddToCart"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.catalog-hero {
  background: var(--color-service);
  color: #faf1e3;
  padding: 2.75rem 1.5rem;
  text-align: center;
}
.catalog-hero__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #f3b9c8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 0.5rem;
}
.catalog-hero h1 {
  font-size: 2.1rem;
  max-width: 640px;
  margin: 0 auto;
}
.catalog-hero__subtitle {
  color: rgba(250, 241, 227, 0.8);
  margin: 0.6rem 0 0;
}

.breadcrumb {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1rem 1.5rem 0;
  font-size: 0.85rem;
  color: var(--color-ink-muted);
}
.breadcrumb a {
  text-decoration: none;
  color: var(--color-ink-muted);
}
.breadcrumb a:hover {
  color: var(--color-accent);
}
.breadcrumb__sep {
  margin: 0 0.45rem;
  color: var(--color-ink-faint);
}
.breadcrumb__current {
  color: var(--color-ink);
  font-weight: 600;
}

.catalog {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.75rem;
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 3rem;
}
.catalog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.catalog__count {
  font-size: 0.88rem;
  color: var(--color-ink-muted);
  margin: 0;
}
.catalog__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-left: auto;
}
.catalog__view-toggle {
  display: flex;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  overflow: hidden;
}
.catalog__view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: var(--color-surface);
  color: var(--color-ink-faint);
  cursor: pointer;
}
.catalog__view-btn.is-active {
  background: var(--color-accent-tint);
  color: var(--color-accent);
}
.catalog__sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-ink-muted);
}
.catalog__sort select {
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
}
.catalog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.1rem;
}
.catalog__grid--list {
  grid-template-columns: 1fr;
}
.catalog__state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-card);
}
.catalog__state-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
  margin: 0 0 0.35rem;
}
.catalog__state-body {
  color: var(--color-ink-muted);
  font-size: 0.9rem;
  margin: 0 0 1rem;
}

.skeleton-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1rem;
}
.skeleton-card__image {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-control);
  background: var(--color-border);
  margin-bottom: 0.9rem;
  animation: pulse 1.4s ease-in-out infinite;
}
.skeleton-card__line {
  height: 10px;
  border-radius: 4px;
  background: var(--color-border);
  margin-bottom: 0.5rem;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 768px) {
  .catalog {
    grid-template-columns: 1fr;
  }
}
</style>