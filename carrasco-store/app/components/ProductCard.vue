<script setup lang="ts">
import type { Product } from '~/types/product'

const props = defineProps<{ product: Product }>()

const emit = defineEmits<{ addToCart: [product: Product] }>()

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
  <article class="product-card">
    <NuxtLink :to="`/producto/${product.slug}`" class="product-card__image-link">
      <img
        v-if="product.images?.[0]"
        :src="product.images[0]"
        :alt="product.name"
        loading="lazy"
      >
      <div v-else class="product-card__image-placeholder" :class="typeMeta.className" />
    </NuxtLink>

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
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.product-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-strong);
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
}
.product-card__image-placeholder.is-service { background: var(--color-service-tint); }
.product-card__image-placeholder.is-physical { background: var(--color-physical-tint); }
.product-card__image-placeholder.is-digital { background: var(--color-digital-tint); }

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