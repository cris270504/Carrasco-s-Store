<script setup lang="ts">
import type { Product } from '~/types/product'

const { addItem } = useCart()
const toast = useToast()

const { data: featuredProducts } = await useFetch<Product[]>('/api/products', {
  query: { limit: 4 },
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

const trustBadges = [
  { icon: 'shield', text: 'Pago seguro' },
  { icon: 'bolt', text: 'Entrega inmediata' },
  { icon: 'headset', text: 'Soporte certificado' },
] as const

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
          <span class="hero__pill">⚡ Ahora con pagos vía Mercado Pago</span>
          <h1>Todo lo que tu proyecto necesita, en un solo carrito</h1>
          <p class="hero__subtitle">
            Productos físicos, licencias digitales y servicios técnicos — comprados, pagados y
            entregados sin cambiar de tienda.
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

    <section v-if="featuredProducts?.length" class="featured">
      <header class="section-header">
        <p class="section-header__eyebrow">Recién agregados</p>
        <h2>Productos destacados</h2>
      </header>

      <div class="featured__grid">
        <ProductCard
          v-for="product in featuredProducts"
          :key="product.id"
          :product="product"
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
          v-for="offer in offerTypes"
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
}

/* Hero */
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  padding: 5rem 1.5rem;
}
.hero__glow {
  position: absolute;
  inset: -20% -10% auto auto;
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 70%);
  filter: blur(10px);
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
  font-weight: 600;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #93c5fd;
  margin-bottom: 1.25rem;
}
.hero h1 {
  font-size: 2.7rem;
  line-height: 1.14;
  margin: 0;
}
.hero__subtitle {
  color: rgba(255, 255, 255, 0.72);
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
}
.hero__cta-secondary {
  font-size: 0.98rem;
  padding: 0.85rem 1.75rem;
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}
.hero__cta-secondary:hover {
  border-color: #fff;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}
.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 2.25rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}
.hero__trust-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.7);
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
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(6px);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  color: #fff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  animation: float 5s ease-in-out infinite;
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

.hero__floater--0 { top: 4%; left: 8%; animation-delay: 0s; }
.hero__floater--1 { top: 42%; left: 32%; animation-delay: 0.6s; z-index: 2; }
.hero__floater--2 { bottom: 6%; left: 2%; animation-delay: 1.2s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
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
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
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
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
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
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  text-decoration: none;
  color: var(--color-ink);
  border-top: 3px solid var(--color-border-strong);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.offer-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}
.offer-card.is-physical { border-top-color: var(--color-physical); }
.offer-card.is-digital { border-top-color: var(--color-digital); }
.offer-card.is-service { border-top-color: var(--color-service); }
.offer-card.is-physical:hover { border-color: var(--color-physical); }
.offer-card.is-digital:hover { border-color: var(--color-digital); }
.offer-card.is-service:hover { border-color: var(--color-service); }

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
  border: 1px solid var(--color-border);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.benefit-card:hover {
  transform: translateY(-3px);
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
  background: var(--color-accent-tint);
  border-radius: var(--radius-card);
}
.cta-band h2 {
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
}
.cta-band p {
  color: var(--color-ink-muted);
  margin: 0 0 1.3rem;
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
</style>
