<script setup lang="ts">
import type { Product } from '~/types/product'

const { addItem } = useCart()

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
  }
  catch {
    // TODO(Parte 4 - Carrito): feedback visual de error al agregar
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
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero__inner">
        <p class="hero__eyebrow">Carrasco Store</p>
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
  gap: 4rem;
  padding-bottom: 1rem;
}

.hero {
  background: radial-gradient(circle at 20% 20%, #2d3a8c 0%, var(--color-ink) 55%, #0e1013 100%);
  color: #fff;
  padding: 5.5rem 1.5rem 4rem;
}
.hero__inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}
.hero__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: #a9b6ff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 1rem;
}
.hero h1 {
  font-size: 2.6rem;
  line-height: 1.15;
  margin: 0 auto;
}
.hero__subtitle {
  color: rgba(255, 255, 255, 0.75);
  font-size: 1.04rem;
  max-width: 560px;
  margin: 1.2rem auto 0;
}
.hero__actions {
  display: flex;
  justify-content: center;
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
  justify-content: center;
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

.featured__grid {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.1rem;
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
  background: var(--color-surface);
  text-decoration: none;
  color: var(--color-ink);
  border-top: 3px solid var(--color-border-strong);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.offer-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}
.offer-card.is-physical { border-top-color: var(--color-physical); }
.offer-card.is-digital { border-top-color: var(--color-digital); }
.offer-card.is-service { border-top-color: var(--color-service); }

.offer-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
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

.benefits__grid {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.1rem;
}
.benefit-card {
  padding: 1.25rem;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
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
  margin: 0 auto;
  padding: 0 1.5rem;
  text-align: center;
  background: var(--color-accent-tint);
  border-radius: var(--radius-card);
  padding: 2.75rem 1.5rem;
}
.cta-band h2 {
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
}
.cta-band p {
  color: var(--color-ink-muted);
  margin: 0 0 1.3rem;
}

@media (max-width: 640px) {
  .hero { padding: 3.5rem 1rem 3rem; }
  .hero h1 { font-size: 1.9rem; }
  .hero__trust { gap: 1rem; }
}
</style>
