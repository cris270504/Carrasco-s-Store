<script setup lang="ts">
const { items, removeItem, setQuantity, subtotal } = useCart()
const { settings, fetchSettings } = useStoreSettings()
const user = useSupabaseUser()

if (!settings.value) await fetchSettings()

const typeLabels: Record<string, string> = {
  physical: 'Físico',
  digital: 'Digital',
  service: 'Servicio',
}

const hasPhysicalItem = computed(() => items.value.some(i => i.itemType === 'physical'))
const shipping = computed(() => calcShipping(hasPhysicalItem.value, settings.value?.shippingFlatRate))
const tax = computed(() => calcTax(subtotal.value))
const total = computed(() => subtotal.value + shipping.value + tax.value)

const checkingOut = ref(false)
const checkoutError = ref('')

async function handleCheckout() {
  if (!user.value) {
    await navigateTo({ path: '/login', query: { redirect: '/cart' } })
    return
  }

  checkoutError.value = ''
  checkingOut.value = true
  try {
    const { initPoint } = await $fetch<{ orderId: string, initPoint: string }>('/api/checkout', {
      method: 'POST',
    })
    await navigateTo(initPoint, { external: true })
  }
  catch (err) {
    checkoutError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'No se pudo iniciar el pago. Intenta nuevamente.'
  }
  finally {
    checkingOut.value = false
  }
}
</script>

<template>
  <div class="cart-page">
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <NuxtLink to="/">Inicio</NuxtLink>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current">Carrito</span>
    </nav>

    <h1 class="cart-page__title">Tu carrito</h1>

    <div v-if="items.length === 0" class="cart-empty">
      <p class="cart-empty__title">Tu carrito está vacío</p>
      <p class="cart-empty__body">Explora el catálogo y agrega productos, licencias o servicios.</p>
      <NuxtLink to="/catalogo" class="btn btn-primary">Ir al catálogo</NuxtLink>
    </div>

    <div v-else class="cart-layout">
      <ul class="cart-lines">
        <li v-for="line in items" :key="line.id" class="cart-line">
          <NuxtLink :to="`/producto/${line.slug}`" class="cart-line__image-link">
            <img v-if="line.image" :src="line.image" :alt="line.name" loading="lazy">
            <div v-else class="cart-line__image-placeholder" :class="`is-${line.itemType}`" />
          </NuxtLink>

          <div class="cart-line__body">
            <p class="cart-line__badge" :class="`is-${line.itemType}`">{{ typeLabels[line.itemType] }}</p>
            <NuxtLink :to="`/producto/${line.slug}`" class="cart-line__name">{{ line.name }}</NuxtLink>
            <p v-if="line.variantLabel" class="cart-line__variant">{{ line.variantLabel }}</p>
            <p v-if="line.itemType === 'service'" class="cart-line__hint">
              La fecha y modalidad se coordinan después de confirmar el pago.
            </p>
          </div>

          <div class="cart-line__qty">
            <button
              type="button"
              class="cart-line__qty-btn"
              aria-label="Restar cantidad"
              @click="setQuantity(line.id, line.quantity - 1)"
            >
              −
            </button>
            <span>{{ line.quantity }}</span>
            <button
              type="button"
              class="cart-line__qty-btn"
              aria-label="Sumar cantidad"
              :disabled="line.itemType !== 'physical'"
              @click="setQuantity(line.id, line.quantity + 1)"
            >
              +
            </button>
          </div>

          <div class="cart-line__price">
            <span class="cart-line__unit">S/ {{ line.unitPrice.toFixed(2) }} c/u</span>
            <span class="cart-line__total">S/ {{ (line.unitPrice * line.quantity).toFixed(2) }}</span>
          </div>

          <button type="button" class="cart-line__remove" aria-label="Quitar del carrito" @click="removeItem(line.id)">
            ✕
          </button>
        </li>
      </ul>

      <aside class="cart-summary">
        <h2>Resumen</h2>
        <div class="cart-summary__row">
          <span>Subtotal</span>
          <span>S/ {{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="cart-summary__row cart-summary__row--muted">
          <span>Envío</span>
          <span>{{ shipping > 0 ? `S/ ${shipping.toFixed(2)}` : 'Gratis' }}</span>
        </div>
        <div class="cart-summary__row cart-summary__row--muted">
          <span>IGV (18%)</span>
          <span>S/ {{ tax.toFixed(2) }}</span>
        </div>
        <div class="ticket-divider" />
        <div class="cart-summary__row cart-summary__row--total">
          <span>Total</span>
          <span>S/ {{ total.toFixed(2) }}</span>
        </div>

        <p v-if="checkoutError" class="cart-summary__error" role="alert">{{ checkoutError }}</p>

        <button
          type="button"
          class="btn btn-primary cart-summary__submit"
          :disabled="checkingOut"
          @click="handleCheckout"
        >
          {{ checkingOut ? 'Redirigiendo…' : 'Continuar al pago' }}
        </button>
        <p class="cart-summary__trust">🔒 Pago seguro procesado con Mercado Pago</p>
        <NuxtLink to="/catalogo" class="cart-summary__continue">Seguir comprando</NuxtLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.cart-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
}
.breadcrumb {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin-bottom: 1rem;
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
.cart-page__title {
  font-size: 1.6rem;
  margin-bottom: 1.25rem;
}

.cart-empty {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-card);
}
.cart-empty__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 0 0.4rem;
}
.cart-empty__body {
  color: var(--color-ink-muted);
  margin: 0 0 1.1rem;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.75rem;
  align-items: start;
}

.cart-lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.cart-line {
  display: grid;
  grid-template-columns: 72px 1fr auto auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
}
.cart-line__image-link {
  display: block;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-control);
  overflow: hidden;
  background: var(--color-bg);
}
.cart-line__image-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cart-line__image-placeholder {
  width: 100%;
  height: 100%;
}
.cart-line__image-placeholder.is-service { background: var(--color-service-tint); }
.cart-line__image-placeholder.is-physical { background: var(--color-physical-tint); }
.cart-line__image-placeholder.is-digital { background: var(--color-digital-tint); }

.cart-line__body {
  min-width: 0;
}
.cart-line__badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  margin: 0 0 0.3rem;
}
.cart-line__badge.is-service { background: var(--color-service-tint); color: var(--color-service-ink); }
.cart-line__badge.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.cart-line__badge.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }
.cart-line__name {
  display: block;
  font-weight: 600;
  color: var(--color-ink);
  text-decoration: none;
}
.cart-line__variant,
.cart-line__hint {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--color-ink-muted);
}

.cart-line__qty {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
}
.cart-line__qty-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  cursor: pointer;
  line-height: 1;
}
.cart-line__qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.cart-line__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}
.cart-line__unit {
  font-size: 0.72rem;
  color: var(--color-ink-faint);
}
.cart-line__total {
  font-family: var(--font-mono);
  font-weight: 700;
}

.cart-line__remove {
  background: none;
  border: none;
  color: var(--color-ink-faint);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.3rem;
}
.cart-line__remove:hover {
  color: var(--color-danger);
}

.cart-summary {
  position: sticky;
  top: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.25rem;
}
.cart-summary h2 {
  font-size: 1rem;
  margin-bottom: 0.9rem;
}
.cart-summary__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  margin-bottom: 0.55rem;
}
.cart-summary__row--muted {
  color: var(--color-ink-faint);
  font-size: 0.8rem;
}
.cart-summary__row--total {
  font-weight: 700;
  font-size: 1.05rem;
  font-family: var(--font-mono);
}
.cart-summary__error {
  color: var(--color-danger);
  font-size: 0.8rem;
  margin: 0.6rem 0 0;
}
.cart-summary__submit {
  width: 100%;
  margin-top: 0.9rem;
}
.cart-summary__trust {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-ink-faint);
  margin: 0.7rem 0 0;
}
.cart-summary__continue {
  display: block;
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  text-decoration: none;
}
.cart-summary__continue:hover {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
  .cart-line {
    grid-template-columns: 56px 1fr;
    grid-template-areas:
      'image body'
      'qty price'
      'remove remove';
    row-gap: 0.6rem;
  }
  .cart-line__image-link { grid-area: image; width: 56px; height: 56px; }
  .cart-line__body { grid-area: body; }
  .cart-line__qty { grid-area: qty; }
  .cart-line__price { grid-area: price; }
  .cart-line__remove { grid-area: remove; justify-self: end; }
}
</style>
