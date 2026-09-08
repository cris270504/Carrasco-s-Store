<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { favorites, loading, fetchFavorites, toggleFavorite } = useFavorites()

if (favorites.value.length === 0) {
  await fetchFavorites()
}

async function handleRemove(productId: string) {
  await toggleFavorite(productId)
}
</script>

<template>
  <div class="favorites-page">
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <NuxtLink to="/">Inicio</NuxtLink>
      <span class="breadcrumb__sep">/</span>
      <span class="breadcrumb__current">Favoritos</span>
    </nav>

    <h1 class="favorites-page__title">Mis favoritos</h1>

    <div v-if="loading" class="favorites-empty">
      <p>Cargando…</p>
    </div>

    <div v-else-if="favorites.length === 0" class="favorites-empty">
      <p class="favorites-empty__title">Todavía no tienes favoritos</p>
      <p class="favorites-empty__body">Toca el corazón en cualquier producto para guardarlo aquí.</p>
      <NuxtLink to="/catalogo" class="btn btn-primary">Ir al catálogo</NuxtLink>
    </div>

    <div v-else class="favorites-grid">
      <article v-for="fav in favorites" :key="fav.id" class="favorite-card">
        <NuxtLink :to="`/producto/${fav.slug}`" class="favorite-card__image-link">
          <img v-if="fav.image" :src="fav.image" :alt="fav.name" loading="lazy">
          <div v-else class="favorite-card__image-placeholder" :class="`is-${fav.type}`">
            <ItemTypeIcon :type="fav.type" :size="28" />
          </div>
        </NuxtLink>
        <div class="favorite-card__body">
          <NuxtLink :to="`/producto/${fav.slug}`" class="favorite-card__name">{{ fav.name }}</NuxtLink>
          <span class="favorite-card__price">S/ {{ Number(fav.price).toFixed(2) }}</span>
        </div>
        <button
          type="button"
          class="favorite-card__remove"
          aria-label="Quitar de favoritos"
          @click="handleRemove(fav.productId)"
        >
          ✕
        </button>
      </article>
    </div>
  </div>
</template>

<style scoped>
.favorites-page {
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
.favorites-page__title {
  font-size: 1.6rem;
  margin-bottom: 1.25rem;
}

.favorites-empty {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-card);
}
.favorites-empty__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 0 0.4rem;
}
.favorites-empty__body {
  color: var(--color-ink-muted);
  margin: 0 0 1.1rem;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.favorite-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}
.favorite-card__image-link {
  display: block;
  aspect-ratio: 4 / 3;
  background: var(--color-bg);
}
.favorite-card__image-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.favorite-card__image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.4;
}
.favorite-card__image-placeholder.is-service { background: var(--color-service-tint); color: var(--color-service-ink); }
.favorite-card__image-placeholder.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.favorite-card__image-placeholder.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }
.favorite-card__body {
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.favorite-card__name {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--color-ink);
  text-decoration: none;
}
.favorite-card__price {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.9rem;
}
.favorite-card__remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-ink-muted);
  cursor: pointer;
}
.favorite-card__remove:hover {
  color: var(--color-danger);
}
</style>
