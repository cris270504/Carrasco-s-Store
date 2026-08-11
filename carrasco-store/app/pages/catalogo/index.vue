<script setup lang="ts">
import type { Product } from '~/types/product'

const { filters, resetFilters } = useProductFilters()

const { data: products, pending, error } = await useFetch<Product[]>('/api/products', {
  query: filters,
})

function handleAddToCart(product: Product) {
  // TODO(Parte 4 - Carrito): reemplazar por llamada a POST /api/cart/items
  console.log('Agregar al carrito:', product.id)
}
</script>

<template>
  <div class="catalog">
    <ProductFilters :filters="filters" @reset="resetFilters" />

    <section class="catalog__results">
      <header class="catalog__header">
        <p class="catalog__eyebrow">Catálogo</p>
        <h1>Todo lo que necesitas, en un solo carrito</h1>
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
        <p>No pudimos cargar el catálogo. Intenta recargar la página.</p>
      </div>

      <div v-else-if="products?.length === 0" class="catalog__state">
        <p class="catalog__state-title">Sin resultados para estos filtros</p>
        <p class="catalog__state-body">Prueba ajustando el tipo, la marca o el rango de precio.</p>
        <button type="button" class="btn btn-outline" @click="resetFilters">Limpiar filtros</button>
      </div>

      <div v-else class="catalog__grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.catalog {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.75rem;
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 3rem;
}
.catalog__header {
  margin-bottom: 1.25rem;
}
.catalog__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.3rem;
}
.catalog__header h1 {
  font-size: 1.6rem;
}
.catalog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.1rem;
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