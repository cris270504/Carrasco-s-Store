<script setup lang="ts">
import type { Product } from '~/types/product'

const route = useRoute()
const { addItem } = useCart()
const { isFavorite, toggleFavorite } = useFavorites()
const togglingFavorite = ref(false)

async function handleToggleFavorite() {
  if (!product.value || togglingFavorite.value) return
  togglingFavorite.value = true
  try {
    await toggleFavorite(product.value.id)
  }
  finally {
    togglingFavorite.value = false
  }
}

const toast = useToast()
const { data: product, error } = await useFetch<Product>(`/api/products/${route.params.slug}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado', fatal: true })
}

const typeLabels: Record<string, string> = {
  physical: 'Físico',
  digital: 'Digital',
  service: 'Servicio',
}

const selectedVariantId = ref<string | null>(product.value?.variants[0]?.id ?? null)

const selectedVariant = computed(() =>
  product.value?.variants.find(v => v.id === selectedVariantId.value) ?? null,
)

const price = computed(() => {
  const base = Number(product.value?.price ?? 0)
  const modifier = Number(selectedVariant.value?.priceModifier ?? 0)
  return base + modifier
})

const stock = computed(() => {
  if (!product.value) return 0
  if (product.value.variants.length > 0) return selectedVariant.value?.stock ?? 0
  return product.value.stock ?? 0
})

const isOutOfStock = computed(() => {
  if (product.value?.type !== 'physical') return false
  return stock.value <= 0
})

const adding = ref(false)
const addedMsg = ref(false)

async function handleAdd() {
  if (!product.value || isOutOfStock.value || adding.value) return
  adding.value = true
  try {
    await addItem({
      productId: product.value.id,
      variantId: selectedVariantId.value,
      preferredModality: product.value.serviceDetail?.defaultModality ?? null,
    })
    addedMsg.value = true
    setTimeout(() => { addedMsg.value = false }, 2000)
  }
  catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.error(fetchError?.data?.statusMessage || 'No se pudo agregar al carrito. Intenta de nuevo.')
  }
  finally {
    adding.value = false
  }
}
</script>

<template>
  <div v-if="product" class="product-page">
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <NuxtLink to="/">Inicio</NuxtLink>
      <span class="breadcrumb__sep">/</span>
      <NuxtLink :to="`/catalogo?type=${product.type}`">Catálogo</NuxtLink>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current">{{ product.name }}</span>
    </nav>

    <div class="product-layout">
      <div class="product-image">
        <NuxtImg v-if="product.images?.[0]" :src="product.images[0]" :alt="product.name" width="600" height="600" fit="cover" />
        <div v-else class="product-image__placeholder" :class="`is-${product.type}`">
          <ItemTypeIcon :type="product.type" :size="56" />
        </div>
      </div>

      <div class="product-info">
        <span class="product-info__badge" :class="`is-${product.type}`">{{ typeLabels[product.type] }}</span>
        <h1>{{ product.name }}</h1>
        <p v-if="product.brand" class="product-info__brand">{{ product.brand }}</p>

        <p class="product-info__price">S/ {{ price.toFixed(2) }}</p>

        <p v-if="product.description" class="product-info__description">{{ product.description }}</p>

        <div v-if="product.variants.length > 0" class="product-info__variants">
          <span class="product-info__label">Opciones</span>
          <div class="product-info__variant-chips">
            <button
              v-for="variant in product.variants"
              :key="variant.id"
              type="button"
              class="product-info__variant-chip"
              :class="{ 'is-active': selectedVariantId === variant.id }"
              @click="selectedVariantId = variant.id"
            >
              {{ variant.name }}: {{ variant.value }}
            </button>
          </div>
        </div>

        <p v-if="product.type === 'service' && product.serviceDetail" class="product-info__hint">
          {{ product.serviceDetail.durationMinutes }} min ·
          {{ product.serviceDetail.defaultModality === 'remote' ? 'Remoto' : 'Presencial' }} ·
          la fecha se coordina después de confirmar el pago.
        </p>
        <p v-else-if="product.type === 'digital'" class="product-info__hint">
          Entrega automática por correo apenas se confirma el pago.
        </p>
        <p v-else-if="product.type === 'physical'" class="product-info__hint">
          {{ stock > 0 ? `${stock} en stock` : 'Agotado' }}
        </p>

        <div class="ticket-divider" />

        <div class="product-info__actions">
          <button
            type="button"
            class="btn btn-primary product-info__cta"
            :disabled="isOutOfStock || adding"
            @click="handleAdd"
          >
            <template v-if="adding">Agregando…</template>
            <template v-else-if="isOutOfStock">Agotado</template>
            <template v-else-if="product.type === 'service'">Agendar</template>
            <template v-else>Agregar al carrito</template>
          </button>
          <button
            type="button"
            class="btn btn-outline product-info__favorite"
            :class="{ 'is-active': isFavorite(product.id) }"
            :aria-label="isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
            :aria-pressed="isFavorite(product.id)"
            :disabled="togglingFavorite"
            @click="handleToggleFavorite"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" :fill="isFavorite(product.id) ? 'currentColor' : 'none'">
              <path
                d="M10 17.3 3.6 11c-2-2-2-5.2 0-7.1 1.9-1.9 4.9-1.7 6.4.4 1.5-2.1 4.5-2.3 6.4-.4 2 1.9 2 5.1 0 7.1L10 17.3Z"
                stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <p v-if="addedMsg" class="product-info__added" role="status">Agregado al carrito ✓</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
}
.breadcrumb {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin-bottom: 1.25rem;
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

.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
}
.product-image {
  aspect-ratio: 1;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-image__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.4;
}
.product-image__placeholder.is-service { background: var(--color-service-tint); color: var(--color-service-ink); }
.product-image__placeholder.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.product-image__placeholder.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }

.product-info__badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  margin-bottom: 0.7rem;
}
.product-info__badge.is-service { background: var(--color-service-tint); color: var(--color-service-ink); }
.product-info__badge.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.product-info__badge.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }

.product-info h1 {
  font-size: 1.7rem;
  margin-bottom: 0.2rem;
}
.product-info__brand {
  color: var(--color-ink-muted);
  margin: 0 0 0.8rem;
}
.product-info__price {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.6rem;
  margin: 0 0 1rem;
}
.product-info__description {
  color: var(--color-ink-muted);
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0 0 1.1rem;
}

.product-info__variants {
  margin-bottom: 1rem;
}
.product-info__label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;
}
.product-info__variant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.product-info__variant-chip {
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
}
.product-info__variant-chip.is-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

.product-info__hint {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin: 0 0 1rem;
}

.product-info__actions {
  display: flex;
  gap: 0.6rem;
}
.product-info__cta {
  flex: 1;
  font-size: 0.98rem;
  padding: 0.85rem;
}
.product-info__favorite {
  flex-shrink: 0;
  width: 48px;
  padding: 0;
  color: var(--color-ink-muted);
}
.product-info__favorite.is-active {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.product-info__added {
  text-align: center;
  color: var(--color-success);
  font-size: 0.85rem;
  margin: 0.6rem 0 0;
}

@media (max-width: 720px) {
  .product-layout {
    grid-template-columns: 1fr;
  }
}
</style>
