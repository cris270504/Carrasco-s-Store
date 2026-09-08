<script setup lang="ts">
import type { Product } from '~/types/product'

const props = withDefaults(defineProps<{ product: Product, view?: 'grid' | 'list' }>(), {
  view: 'grid',
})

const emit = defineEmits<{ addToCart: [product: Product] }>()

const { isFavorite, toggleFavorite } = useFavorites()
const togglingFavorite = ref(false)

async function handleToggleFavorite() {
  if (togglingFavorite.value) return
  togglingFavorite.value = true
  try {
    await toggleFavorite(props.product.id)
  }
  finally {
    togglingFavorite.value = false
  }
}

const typeMeta = computed(() => {
  switch (props.product.type) {
    case 'service':
      return { label: 'Servicio', className: 'is-service' }
    case 'digital':
      return { label: 'Digital', className: 'is-digital' }
    default:
      return { label: 'Físico', className: 'is-physical' }
  }
})

// Folio corto tipo "orden de servicio", derivado del id — visible y consistente,
// no es un dato nuevo que guardar, solo una lectura del id ya existente.
const ticketCode = computed(() => props.product.id.slice(0, 6).toUpperCase())

const availabilityLabel = computed(() => {
  if (props.product.type === 'service') {
    return props.product.serviceDetail
      ? `${props.product.serviceDetail.durationMinutes} min · ${props.product.serviceDetail.defaultModality === 'remote' ? 'Remoto' : 'Presencial'}`
      : 'Agendamiento disponible'
  }
  if (props.product.type === 'digital') {
    return 'Entrega automática por correo'
  }
  if (props.product.variants.length > 0) {
    return `${props.product.variants.length} opciones disponibles`
  }
  return (props.product.stock ?? 0) > 0 ? `${props.product.stock} en stock` : 'Agotado'
})

const isOutOfStock = computed(() => {
  if (props.product.type !== 'physical') return false
  if (props.product.variants.length > 0) return false
  return (props.product.stock ?? 0) <= 0
})
</script>

<template>
  <article class="product-card" :class="`product-card--${view}`">
    <NuxtLink :to="`/producto/${product.slug}`" class="product-card__image-link">
      <NuxtImg
        v-if="product.images?.[0]"
        :src="product.images[0]"
        :alt="product.name"
        loading="lazy"
        width="400"
        height="300"
        fit="cover"
      />
      <div v-else class="product-card__image-placeholder" :class="typeMeta.className">
        <ItemTypeIcon :type="product.type" />
      </div>
    </NuxtLink>

    <button
      type="button"
      class="product-card__favorite"
      :class="{ 'is-active': isFavorite(product.id) }"
      :disabled="togglingFavorite"
      :aria-label="isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'"
      @click="handleToggleFavorite"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" :fill="isFavorite(product.id) ? 'currentColor' : 'none'">
        <path
          d="M10 17.3 3.6 11c-2-2-2-5.2 0-7.1 1.9-1.9 4.9-1.7 6.4.4 1.5-2.1 4.5-2.3 6.4-.4 2 1.9 2 5.1 0 7.1L10 17.3Z"
          stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"
        />
      </svg>
    </button>

    <div class="product-card__body">
      <p class="product-card__eyebrow">
        <span class="product-card__badge" :class="typeMeta.className">{{ typeMeta.label }}</span>
        <span class="product-card__ticket">#{{ ticketCode }}</span>
      </p>

      <h3 class="product-card__name">
        <NuxtLink :to="`/producto/${product.slug}`">{{ product.name }}</NuxtLink>
      </h3>
      <p v-if="product.brand" class="product-card__brand">{{ product.brand }}</p>

      <div class="ticket-divider" />

      <div class="product-card__footer">
        <div>
          <span class="product-card__price">S/ {{ Number(product.price).toFixed(2) }}</span>
          <span class="product-card__availability">{{ availabilityLabel }}</span>
        </div>

        <button
          v-if="product.type !== 'physical' || product.variants.length === 0"
          class="btn btn-primary"
          :disabled="isOutOfStock"
          @click="emit('addToCart', product)"
        >
          {{ product.type === 'service' ? 'Agendar' : 'Agregar' }}
        </button>
        <NuxtLink v-else :to="`/producto/${product.slug}`" class="btn btn-outline">
          Ver opciones
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.product-card__favorite {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-ink-muted);
  cursor: pointer;
  backdrop-filter: blur(2px);
}
.product-card__favorite:hover {
  color: var(--color-danger);
}
.product-card__favorite.is-active {
  color: var(--color-danger);
}
.product-card__favorite:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.product-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-strong);
}

.product-card--list {
  flex-direction: row;
}
.product-card--list:hover {
  transform: none;
}
.product-card--list .product-card__image-link {
  width: 180px;
  flex-shrink: 0;
  aspect-ratio: auto;
}
.product-card--list .product-card__body {
  flex: 1;
  justify-content: center;
}
.product-card--list .ticket-divider {
  margin: 0.6rem 0;
}
/* El offset default del divisor (-1.5rem) queda fuera del padding de esta
   tarjeta (1rem) y el "overflow: hidden" del .product-card (necesario para
   el zoom de la imagen) lo recorta, perdiendo el efecto de "ticket
   perforado" — se reduce el offset para que quepa dentro del padding. */
.product-card .ticket-divider::before {
  left: -0.4rem;
}
.product-card .ticket-divider::after {
  right: -0.4rem;
}

.product-card__image-link {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--color-bg);
}
.product-card__image-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.product-card:hover .product-card__image-link img {
  transform: scale(1.03);
}
.product-card__image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.4;
}
.product-card__image-placeholder.is-service { background: var(--color-service-tint); color: var(--color-service-ink); }
.product-card__image-placeholder.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.product-card__image-placeholder.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }

.product-card__body {
  padding: 0.9rem 1rem 1.1rem;
  display: flex;
  flex-direction: column;
}

.product-card__eyebrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
}
.product-card__badge {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
}
.product-card__badge.is-service { background: var(--color-service-tint); color: var(--color-service-ink); }
.product-card__badge.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.product-card__badge.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }

.product-card__ticket {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-ink-faint);
}

.product-card__name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.55rem 0 0.1rem;
}
.product-card__name a {
  text-decoration: none;
  color: var(--color-ink);
}
.product-card__brand {
  font-size: 0.82rem;
  color: var(--color-ink-muted);
  margin: 0;
}

.product-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.6rem;
}
.product-card__price {
  display: block;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.05rem;
}
.product-card__availability {
  display: block;
  font-size: 0.75rem;
  color: var(--color-ink-muted);
  margin-top: 0.15rem;
}
.product-card__footer .btn {
  flex-shrink: 0;
  padding: 0.55rem 0.9rem;
  font-size: 0.82rem;
}
</style>