<script setup lang="ts">
const categories = [
  {
    type: 'physical',
    label: 'Físicos',
    className: 'is-physical',
    description: 'Hardware y accesorios con stock y variantes en tiempo real.',
  },
  {
    type: 'digital',
    label: 'Digitales',
    className: 'is-digital',
    description: 'Licencias y códigos con entrega automática por correo.',
  },
  {
    type: 'service',
    label: 'Servicios',
    className: 'is-service',
    description: 'Soporte técnico agendado, remoto o presencial.',
  },
] as const
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="hero__eyebrow">Carrasco Store</p>
      <h1>Productos, licencias y servicios técnicos en un solo carrito</h1>
      <p class="hero__subtitle">
        Compra hardware, licencias digitales y agenda soporte técnico sin cambiar de tienda ni de carrito.
      </p>
      <NuxtLink to="/catalogo" class="btn btn-primary hero__cta">Ver catálogo</NuxtLink>
    </section>

    <section class="categories">
      <h2 class="categories__title">Compra por tipo</h2>
      <div class="categories__grid">
        <NuxtLink
          v-for="category in categories"
          :key="category.type"
          :to="`/catalogo?type=${category.type}`"
          class="category-card"
          :class="category.className"
        >
          <span class="category-card__label">{{ category.label }}</span>
          <p class="category-card__description">{{ category.description }}</p>
          <span class="category-card__link">Explorar →</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 1.5rem 3.5rem;
}

.hero {
  padding: 4.5rem 1rem 3.5rem;
  text-align: center;
}
.hero__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 0.75rem;
}
.hero h1 {
  font-size: 2.4rem;
  max-width: 720px;
  margin: 0 auto;
  line-height: 1.15;
}
.hero__subtitle {
  color: var(--color-ink-muted);
  font-size: 1.02rem;
  max-width: 560px;
  margin: 1.1rem auto 0;
}
.hero__cta {
  margin-top: 1.75rem;
  font-size: 0.98rem;
  padding: 0.85rem 1.75rem;
}

.categories__title {
  font-size: 1.3rem;
  margin-bottom: 1.1rem;
}
.categories__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.1rem;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  text-decoration: none;
  color: var(--color-ink);
  border-top: 3px solid var(--color-border-strong);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.category-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}
.category-card.is-physical { border-top-color: var(--color-physical); }
.category-card.is-digital { border-top-color: var(--color-digital); }
.category-card.is-service { border-top-color: var(--color-service); }

.category-card__label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
}
.category-card__description {
  color: var(--color-ink-muted);
  font-size: 0.88rem;
  margin: 0;
}
.category-card__link {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-accent);
}

@media (max-width: 640px) {
  .hero { padding: 3rem 0.5rem 2.5rem; }
  .hero h1 { font-size: 1.85rem; }
}
</style>
