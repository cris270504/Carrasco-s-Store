<script setup lang="ts">
const user = useSupabaseUser()
const { count } = useCart()
const { theme, init, toggle } = useTheme()
const isAdmin = useIsAdmin()

onMounted(() => { init() })
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <NuxtLink to="/" class="app-header__logo">Carrasco Store</NuxtLink>

      <nav class="app-header__nav" aria-label="Navegación principal">
        <NuxtLink to="/catalogo" class="app-header__link">Catálogo</NuxtLink>
      </nav>

      <div class="app-header__actions">
        <button
          type="button"
          class="app-header__icon-link"
          :aria-label="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          @click="toggle"
        >
          <svg v-if="theme === 'dark'" width="19" height="19" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.4" />
            <path
              d="M10 2v1.6M10 16.4V18M18 10h-1.6M3.6 10H2M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1M15.5 15.5l-1.1-1.1M5.6 5.6 4.5 4.5"
              stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
            />
          </svg>
          <svg v-else width="19" height="19" viewBox="0 0 20 20" fill="none">
            <path
              d="M17 11.5A7.5 7.5 0 0 1 8.5 3 7.5 7.5 0 1 0 17 11.5Z"
              stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"
            />
          </svg>
        </button>

        <NuxtLink to="/favoritos" class="app-header__icon-link" aria-label="Favoritos">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 17.3 3.6 11c-2-2-2-5.2 0-7.1 1.9-1.9 4.9-1.7 6.4.4 1.5-2.1 4.5-2.3 6.4-.4 2 1.9 2 5.1 0 7.1L10 17.3Z"
              stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"
            />
          </svg>
        </NuxtLink>

        <NuxtLink to="/cart" class="app-header__icon-link" aria-label="Carrito">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 2h2l1.2 9.6A1.5 1.5 0 0 0 6.68 13h8.14a1.5 1.5 0 0 0 1.48-1.24L17.5 5H4.5"
              stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
            />
            <circle cx="7.5" cy="17" r="1.3" fill="currentColor" />
            <circle cx="14.5" cy="17" r="1.3" fill="currentColor" />
          </svg>
          <span v-if="count > 0" class="app-header__badge">{{ count }}</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAdmin"
          to="/admin"
          class="app-header__icon-link"
          aria-label="Panel de administración"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4" />
            <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4" />
            <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4" />
            <rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </NuxtLink>

        <NuxtLink
          :to="user ? '/dashboard' : '/login'"
          class="app-header__icon-link"
          :aria-label="user ? 'Mi panel' : 'Iniciar sesión'"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" stroke-width="1.4" />
            <path
              d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6"
              stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.app-header__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.app-header__logo {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
  text-decoration: none;
  color: var(--color-ink);
}
.app-header__nav {
  display: flex;
  gap: 1.1rem;
  margin-right: auto;
}
.app-header__link {
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--color-ink-muted);
}
.app-header__link:hover,
.app-header__link.router-link-active {
  color: var(--color-accent);
}
.app-header__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.app-header__icon-link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--color-ink-muted);
  cursor: pointer;
}
.app-header__icon-link:hover {
  background: var(--color-bg);
  color: var(--color-ink);
}
.app-header__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--color-accent);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
</style>
