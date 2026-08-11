<script setup lang="ts">
const offerTypes = [
  {
    type: 'physical',
    className: 'is-physical',
    label: 'Productos Físicos',
    description: 'Hardware, accesorios y periféricos con stock y variantes en tiempo real.',
    bullets: ['Stock verificado', 'Variantes de capacidad/color', 'Envío a todo el país'],
  },
  {
    type: 'digital',
    className: 'is-digital',
    label: 'Licencias Digitales',
    description: 'Códigos y licencias de software con entrega automática por correo.',
    bullets: ['Entrega inmediata', 'Códigos originales', 'Sin envío físico'],
  },
  {
    type: 'service',
    className: 'is-service',
    label: 'Servicios Técnicos',
    description: 'Soporte especializado agendado, remoto o presencial, a tu medida.',
    bullets: ['Agenda flexible', 'Remoto o presencial', 'Técnicos certificados'],
  },
] as const

const benefits = [
  {
    title: 'Pago 100% seguro',
    description: 'Checkout integrado con Mercado Pago, la pasarela líder en la región.',
  },
  {
    title: 'Entrega según el ítem',
    description: 'Envío a domicilio para físicos, correo instantáneo para digitales.',
  },
  {
    title: 'Soporte técnico real',
    description: 'Servicios agendados con seguimiento de estado hasta su finalización.',
  },
  {
    title: 'Un solo carrito',
    description: 'Combina físico, digital y servicios en una única compra.',
  },
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
          <span class="offer-card__icon" aria-hidden="true" />
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
  padding: 5.5rem 1.5rem 5rem;
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
  width: 42px;
  height: 42px;
  border-radius: 12px;
}
.offer-card.is-physical .offer-card__icon { background: var(--color-physical-tint); }
.offer-card.is-digital .offer-card__icon { background: var(--color-digital-tint); }
.offer-card.is-service .offer-card__icon { background: var(--color-service-tint); }

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
  padding-left: 1rem;
  position: relative;
}
.offer-card__bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border-strong);
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
}
</style>
