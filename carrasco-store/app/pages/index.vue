<script setup lang="ts">
import type { Product } from '~/types/product'

const { addItem } = useCart()
const toast = useToast()
const { settings, ensureSettings } = useStoreSettings()
onMounted(() => { ensureSettings() })

const { data: featuredProducts } = await useFetch<Product[]>('/api/products', {
  query: { limit: 4 },
})

const storeName = computed(() => settings.value?.storeName || 'Carrasco Store')

useSeoMeta({
  title: () => `${storeName.value} — Físicos, digitales y servicios en un solo carrito`,
  description: 'Compra productos físicos, licencias digitales y servicios técnicos con pago seguro vía Mercado Pago y entrega según el ítem, todo en una sola tienda.',
  ogTitle: () => `${storeName.value} — Físicos, digitales y servicios en un solo carrito`,
  ogDescription: 'Productos físicos, licencias digitales y servicios técnicos, comprados, pagados y entregados sin cambiar de tienda.',
  ogImage: featuredProducts.value?.[0]?.images?.[0],
})

// Hero configurable desde /admin/configuracion; si el admin no cargo nada
// todavia, se usan los textos originales como fallback.
const heroBadge = computed(() => settings.value?.homeHeroBadge || '⚡ Ahora con pagos vía Mercado Pago')
const heroTitle = computed(() => settings.value?.homeHeroTitle || 'Todo lo que tu proyecto necesita.')
const heroSubtitle = computed(() => settings.value?.homeHeroSubtitle || 'Productos físicos, licencias digitales y servicios técnicos — comprados, pagados y entregados sin cambiar de tienda.')

const addingId = ref<string | null>(null)

async function handleAddToCart(product: Product) {
  addingId.value = product.id
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
  finally {
    addingId.value = null
  }
}

const offerTypes = [
  {
    type: 'physical',
    className: 'is-physical',
    label: 'Productos Físicos',
    description: 'Hardware, accesorios y periféricos con stock y variantes en tiempo real.',
    bullets: ['Stock verificado', 'Variantes de capacidad/color', 'Envío a todo el país'],
    icon: 'box',
  },
  {
    type: 'digital',
    className: 'is-digital',
    label: 'Licencias Digitales',
    description: 'Códigos y licencias de software con entrega automática por correo.',
    bullets: ['Entrega inmediata', 'Códigos originales', 'Sin envío físico'],
    icon: 'key',
  },
  {
    type: 'service',
    className: 'is-service',
    label: 'Servicios Técnicos',
    description: 'Soporte especializado agendado, remoto o presencial, a tu medida.',
    bullets: ['Agenda flexible', 'Remoto o presencial', 'Técnicos certificados'],
    icon: 'wrench',
  },
] as const

// Oculta la tarjeta de un tipo de producto si esa linea de negocio esta
// desactivada en Configuracion. `settings.value` puede ser null mientras
// carga (ver app.vue): en ese caso se muestran las 3, para no parpadear.
const visibleOfferTypes = computed(() => offerTypes.filter((offer) => {
  if (!settings.value) return true
  if (offer.type === 'physical') return settings.value.physicalEnabled
  if (offer.type === 'digital') return settings.value.digitalEnabled
  return settings.value.serviceEnabled
}))

const benefits = [
  {
    icon: 'shield',
    title: 'Pago 100% seguro',
    description: 'Checkout integrado con Mercado Pago, la pasarela líder en la región.',
  },
  {
    icon: 'bolt',
    title: 'Entrega según el ítem',
    description: 'Envío a domicilio para físicos, correo instantáneo para digitales.',
  },
  {
    icon: 'headset',
    title: 'Soporte técnico real',
    description: 'Servicios agendados con seguimiento de estado hasta su finalización.',
  },
  {
    icon: 'cart',
    title: 'Un solo carrito',
    description: 'Combina físico, digital y servicios en una única compra.',
  },
] as const

const defaultTrustBadges = [
  { icon: 'shield', text: 'Pago seguro' },
  { icon: 'bolt', text: 'Entrega inmediata' },
  { icon: 'headset', text: 'Soporte certificado' },
]
const trustBadges = computed(() => settings.value?.homeTrustBadges?.length ? settings.value.homeTrustBadges : defaultTrustBadges)

const heroFloaters = [
  { icon: 'box', label: 'Físico', className: 'is-physical' },
  { icon: 'key', label: 'Digital', className: 'is-digital' },
  { icon: 'wrench', label: 'Servicio', className: 'is-service' },
] as const
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero__glow" aria-hidden="true" />
      <div class="hero__inner">
        <div class="hero__copy">
          <span class="hero__pill">{{ heroBadge }}</span>
          <h1>{{ heroTitle }}</h1>
          <p class="hero__subtitle">
            {{ heroSubtitle }}
          </p>
          <div class="hero__actions">
            <NuxtLink to="/catalogo" class="btn btn-primary hero__cta">Ver catálogo</NuxtLink>
            <NuxtLink to="/register" class="btn btn-outline hero__cta-secondary">Crear cuenta gratis</NuxtLink>
          </div>

          <div class="hero__trust">
            <span v-for="badge in trustBadges" :key="badge.text" class="hero__trust-item">
              <svg v-if="badge.icon === 'shield'" width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M10 2l7 3v5c0 4.5-3 7-7 8-4-1-7-3.5-7-8V5l7-3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="badge.icon === 'bolt'" width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M11 2 4 12h5l-1 6 7-10h-5l1-6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M4 11v-1a6 6 0 0 1 12 0v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <rect x="2.5" y="11" width="3.5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.5" />
                <rect x="14" y="11" width="3.5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.5" />
              </svg>
              {{ badge.text }}
            </span>
          </div>
        </div>

        <div class="hero__visual" aria-hidden="true">
          <div
            v-for="(floater, i) in heroFloaters"
            :key="floater.label"
            class="hero__floater"
            :class="[floater.className, `hero__floater--${i}`]"
          >
            <span class="hero__floater-icon">
              <svg v-if="floater.icon === 'box'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 8l9-4 9 4-9 4-9-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                <path d="M3 8v8l9 4 9-4V8" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                <path d="M12 12v8" stroke="currentColor" stroke-width="1.6" />
              </svg>
              <svg v-else-if="floater.icon === 'key'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="15" r="4" stroke="currentColor" stroke-width="1.6" />
                <path d="M11 12l9-9M17 6l3 3M14 9l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L4 17l3 3 5.9-5.9a3.5 3.5 0 0 1 4.6-4.6L21 6l-3-3-3.5 3.5Z"
                  stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="hero__floater-label">{{ floater.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <ClientOnly>
      <OfferCountdown />
    </ClientOnly>

    <section v-if="featuredProducts?.length" class="featured">
      <header class="section-header">
        <p class="section-header__eyebrow">Recién agregados</p>
        <h2>Productos destacados</h2>
      </header>

      <div class="featured__grid">
        <ProductCard
          v-for="(product, index) in featuredProducts"
          :key="product.id"
          :product="product"
          :priority="index < 4"
          :adding="addingId === product.id"
          @add-to-cart="handleAddToCart"
        />
      </div>

      <div class="featured__footer">
        <NuxtLink to="/catalogo" class="featured__view-all">Ver todo el catálogo →</NuxtLink>
      </div>
    </section>

    <section class="offers">
      <header class="section-header">
        <p class="section-header__eyebrow">Elige tu categoría</p>
        <h2>Tres formas de comprar, un solo checkout</h2>
      </header>

      <div class="offers__grid">
        <NuxtLink
          v-for="offer in visibleOfferTypes"
          :key="offer.type"
          :to="`/catalogo?type=${offer.type}`"
          class="offer-card"
          :class="offer.className"
        >
          <span class="offer-card__icon">
            <svg v-if="offer.icon === 'box'" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l9-4 9 4-9 4-9-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              <path d="M3 8v8l9 4 9-4V8" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              <path d="M12 12v8" stroke="currentColor" stroke-width="1.6" />
            </svg>
            <svg v-else-if="offer.icon === 'key'" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="8" cy="15" r="4" stroke="currentColor" stroke-width="1.6" />
              <path d="M11 12l9-9M17 6l3 3M14 9l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L4 17l3 3 5.9-5.9a3.5 3.5 0 0 1 4.6-4.6L21 6l-3-3-3.5 3.5Z"
                stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"
              />
            </svg>
          </span>
          <h3>{{ offer.label }}</h3>
          <p>{{ offer.description }}</p>
          <ul class="offer-card__bullets">
            <li v-for="bullet in offer.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
          <span class="offer-card__link">Explorar {{ offer.label.toLowerCase() }} →</span>
        </NuxtLink>
      </div>
    </section>

    <section class="benefits">
      <header class="section-header">
        <p class="section-header__eyebrow">Por qué Carrasco Store</p>
        <h2>Pensado para comprar sin fricción</h2>
      </header>

      <div class="benefits__grid">
        <div v-for="benefit in benefits" :key="benefit.title" class="benefit-card">
          <span class="benefit-card__icon">
            <svg v-if="benefit.icon === 'shield'" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2l7 3v5c0 4.5-3 7-7 8-4-1-7-3.5-7-8V5l7-3Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
              <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="benefit.icon === 'bolt'" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M11 2 4 12h5l-1 6 7-10h-5l1-6Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="benefit.icon === 'headset'" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 11v-1a6 6 0 0 1 12 0v1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              <rect x="2.5" y="11" width="3.5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.4" />
              <rect x="14" y="11" width="3.5" height="5" rx="1.3" stroke="currentColor" stroke-width="1.4" />
              <path d="M16 16v1a3 3 0 0 1-3 3h-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 2h2l1.2 9.6A1.5 1.5 0 0 0 6.68 13h8.14a1.5 1.5 0 0 0 1.48-1.24L17.5 5H4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="7.5" cy="17" r="1.3" fill="currentColor" />
              <circle cx="14.5" cy="17" r="1.3" fill="currentColor" />
            </svg>
          </span>
          <h3>{{ benefit.title }}</h3>
          <p>{{ benefit.description }}</p>
        </div>
      </div>
    </section>

    <section class="cta-band">
      <h2>¿Listo para empezar?</h2>
      <p>Explora el catálogo completo y arma tu pedido en minutos.</p>
      <NuxtLink to="/catalogo" class="btn btn-primary cta-band__btn">Ir al catálogo</NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  /* Espacio reservado para OfferCountdown, que ahora es position: fixed en
     la parte inferior (ver OfferCountdown.vue) y ya no ocupa lugar en el
     flujo normal. Se aplica siempre, aunque el contador no se muestre (no
     hay fecha configurada o ya venció): el espacio extra al final de la
     pagina en ese caso es un costo estetico menor y aceptable. */
  padding-bottom: 90px;
}

/* Hero — bloque de color plano estilo afiche, como la portada de referencia */
.hero {
  position: relative;
  overflow: hidden;
  background: var(--color-accent);
  color: #16110d;
  padding: 5rem 1.5rem;
}
.hero__glow {
  position: absolute;
  inset: auto -8% -30% auto;
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, rgba(255, 90, 60, 0.35) 0%, rgba(255, 90, 60, 0) 70%);
  pointer-events: none;
}
.hero__inner {
  position: relative;
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 2.5rem;
}
.hero__pill {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: #16110d;
  color: #faf1e3;
  margin-bottom: 1.25rem;
}
.hero h1 {
  font-size: 3.1rem;
  margin: 0;
}
.hero__subtitle {
  color: rgba(22, 17, 13, 0.78);
  font-weight: 500;
  font-size: 1.04rem;
  max-width: 480px;
  margin: 1.2rem 0 0;
}
.hero__actions {
  display: flex;
  gap: 0.9rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}
.hero__cta {
  font-size: 0.98rem;
  padding: 0.85rem 1.75rem;
  background: #16110d;
  border-color: #16110d;
  color: #faf1e3;
  box-shadow: 3px 3px 0 0 rgba(22, 17, 13, 0.35);
}
.hero__cta:hover {
  background: #2b241e;
}
.hero__cta-secondary {
  font-size: 0.98rem;
  padding: 0.85rem 1.75rem;
  background: transparent;
  border-color: #16110d;
  color: #16110d;
}
.hero__cta-secondary:hover {
  background: rgba(22, 17, 13, 0.08);
  border-color: #16110d;
  color: #16110d;
}
.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 2.25rem;
  padding-top: 1.75rem;
  border-top: 2px solid rgba(22, 17, 13, 0.2);
}
.hero__trust-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(22, 17, 13, 0.75);
}

.hero__visual {
  position: relative;
  height: 320px;
  display: none;
}
.hero__floater {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1.2rem;
  border-radius: 12px;
  background: #faf1e3;
  border: 2px solid #16110d;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.95rem;
  color: #16110d;
  box-shadow: 5px 5px 0 0 #16110d;
  animation: float 5s ease-in-out infinite;
  transform: rotate(var(--rot, 0deg));
}
.hero__floater-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  flex-shrink: 0;
}
.hero__floater.is-physical .hero__floater-icon { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.hero__floater.is-digital .hero__floater-icon { background: var(--color-digital-tint); color: var(--color-digital-ink); }
.hero__floater.is-service .hero__floater-icon { background: var(--color-service-tint); color: var(--color-service-ink); }

.hero__floater--0 { top: 4%; left: 8%; animation-delay: 0s; --rot: -4deg; }
.hero__floater--1 { top: 42%; left: 32%; animation-delay: 0.6s; z-index: 2; --rot: 3deg; }
.hero__floater--2 { bottom: 6%; left: 2%; animation-delay: 1.2s; --rot: -2deg; }

@keyframes float {
  0%, 100% { transform: rotate(var(--rot, 0deg)) translateY(0); }
  50% { transform: rotate(var(--rot, 0deg)) translateY(-10px); }
}

/* Section rhythm */
.section-header {
  max-width: 1180px;
  margin: 0 auto 1.75rem;
  padding: 0 1.5rem;
  text-align: center;
}
.section-header__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.4rem;
}
.section-header h2 {
  font-size: 1.55rem;
}

.featured {
  padding: 3.5rem 0;
}
.featured__grid {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 280px));
  gap: 1.1rem;
}
.featured__footer {
  max-width: 1180px;
  margin: 1.5rem auto 0;
  padding: 0 1.5rem;
  text-align: center;
}
.featured__view-all {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
}
.featured__view-all:hover {
  text-decoration: underline;
}

.offers {
  background: var(--color-surface);
  border-top: 2px solid var(--color-border-strong);
  border-bottom: 2px solid var(--color-border-strong);
  padding: 3.5rem 0;
}
.offers__grid {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}
.offer-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 1.75rem;
  border-radius: var(--radius-card);
  border: 2px solid var(--color-border-strong);
  background: var(--color-surface);
  text-decoration: none;
  color: var(--color-ink);
  box-shadow: var(--shadow-card);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.offer-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-card-hover);
}

.offer-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
}
.offer-card.is-physical .offer-card__icon { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.offer-card.is-digital .offer-card__icon { background: var(--color-digital-tint); color: var(--color-digital-ink); }
.offer-card.is-service .offer-card__icon { background: var(--color-service-tint); color: var(--color-service-ink); }

.offer-card h3 {
  font-size: 1.15rem;
}
.offer-card p {
  color: var(--color-ink-muted);
  font-size: 0.88rem;
  margin: 0;
}
.offer-card__bullets {
  list-style: none;
  margin: 0.3rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.offer-card__bullets li {
  font-size: 0.8rem;
  color: var(--color-ink-muted);
  padding-left: 1.1rem;
  position: relative;
}
.offer-card__bullets li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.72rem;
}
.offer-card__link {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-accent);
}

.benefits {
  padding: 3.5rem 0;
}
.benefits__grid {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.1rem;
}
.benefit-card {
  padding: 1.4rem;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  border: 2px solid var(--color-border-strong);
  box-shadow: var(--shadow-card);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.benefit-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-card-hover);
}
.benefit-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  margin-bottom: 0.8rem;
}
.benefit-card h3 {
  font-size: 0.98rem;
  margin-bottom: 0.4rem;
}
.benefit-card p {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  margin: 0;
}

.cta-band {
  max-width: 1180px;
  margin: 0.5rem auto 3.5rem;
  padding: 2.75rem 1.5rem;
  text-align: center;
  background: var(--color-service);
  color: #faf1e3;
  border-radius: var(--radius-card);
  border: 2px solid var(--color-border-strong);
  box-shadow: var(--shadow-card);
}
.cta-band h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}
.cta-band p {
  color: rgba(250, 241, 227, 0.82);
  margin: 0 0 1.3rem;
}
.cta-band .btn-primary {
  background: #faf1e3;
  color: var(--color-service);
  border-color: var(--color-border-strong);
}
.cta-band .btn-primary:hover {
  background: #fff;
}

@media (min-width: 900px) {
  .hero__visual {
    display: block;
  }
}

@media (max-width: 899px) {
  .hero__inner {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero__subtitle {
    margin-left: auto;
    margin-right: auto;
  }
  .hero__actions,
  .hero__trust {
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .hero { padding: 3.5rem 1rem 3rem; }
  .hero h1 { font-size: 1.9rem; }
  .hero__trust { gap: 1rem; }
}

/* Mismo breakpoint que OfferCountdown.vue (max-width: 720px): ahi su
   contenido se apila verticalmente y la banda fija ocupa mas alto, asi
   que se reserva mas espacio abajo para no tapar el contenido. */
@media (max-width: 720px) {
  .home {
    padding-bottom: 110px;
  }
}
</style>
