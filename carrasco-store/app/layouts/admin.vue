<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()

const links: { to: string, label: string, icon: string, exact?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { to: '/admin/finanzas', label: 'Finanzas', icon: 'chart' },
  { to: '/admin/productos', label: 'Productos', icon: 'box' },
  { to: '/admin/costos', label: 'Costos', icon: 'tag' },
  { to: '/admin/ventas-particulares', label: 'Ventas particulares', icon: 'cash' },
  { to: '/admin/ordenes', label: 'Órdenes', icon: 'receipt' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
  { to: '/admin/configuracion', label: 'Configuración', icon: 'gear' },
]

function isActive(to: string, exact?: boolean) {
  return exact ? route.path === to : route.path.startsWith(to)
}

async function handleLogout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <NuxtLink to="/admin" class="admin-sidebar__logo">
        Carrasco <span>Admin</span>
      </NuxtLink>

      <nav class="admin-sidebar__nav">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="admin-sidebar__link"
          :class="{ 'is-active': isActive(link.to, link.exact) }"
        >
          <svg v-if="link.icon === 'grid'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1.3" stroke="currentColor" stroke-width="1.5" />
            <rect x="11" y="2" width="7" height="7" rx="1.3" stroke="currentColor" stroke-width="1.5" />
            <rect x="2" y="11" width="7" height="7" rx="1.3" stroke="currentColor" stroke-width="1.5" />
            <rect x="11" y="11" width="7" height="7" rx="1.3" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <svg v-else-if="link.icon === 'chart'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 3v14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M6 13l3-4 3 2 4-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else-if="link.icon === 'tag'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2H4a2 2 0 0 0-2 2v6l8 8 8-8-8-8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" />
          </svg>
          <svg v-else-if="link.icon === 'cash'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="5" width="16" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5" />
            <circle cx="10" cy="10" r="2.2" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <svg v-else-if="link.icon === 'box'" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l9-4 9 4-9 4-9-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M3 8v8l9 4 9-4V8" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M12 12v8" stroke="currentColor" stroke-width="1.6" />
          </svg>
          <svg v-else-if="link.icon === 'receipt'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M4 2h12v16l-2-1.3L12 18l-2-1.3L8 18l-2-1.3L4 18V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M6.5 6.5h7M6.5 10h7M6.5 13.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <svg v-else-if="link.icon === 'users'" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="7" cy="6.5" r="2.7" stroke="currentColor" stroke-width="1.5" />
            <path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <circle cx="15" cy="7" r="2.2" stroke="currentColor" stroke-width="1.4" />
            <path d="M13.5 11.2c2.3.3 4 2.2 4 5.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 6.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
              stroke="currentColor" stroke-width="1.5"
            />
            <path
              d="M10 2.2v1.7M10 16.1v1.7M17.8 10h-1.7M3.9 10H2.2M15.4 4.6l-1.2 1.2M5.8 14.2l-1.2 1.2M15.4 15.4l-1.2-1.2M5.8 5.8 4.6 4.6"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            />
          </svg>
          {{ link.label }}
        </NuxtLink>
      </nav>

      <NuxtLink to="/" class="admin-sidebar__exit">← Volver a la tienda</NuxtLink>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <span class="admin-topbar__env">Panel interno</span>
        <div class="admin-topbar__user">
          <span>{{ user?.email }}</span>
          <button type="button" class="btn btn-ghost" @click="handleLogout">Salir</button>
        </div>
      </header>

      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: 230px;
  flex-shrink: 0;
  padding: 1.25rem 1rem;
  background: #16110d;
  color: rgba(246, 236, 220, 0.85);
  position: sticky;
  top: 0;
  height: 100vh;
}
.admin-sidebar__logo {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
  color: #fff;
  text-decoration: none;
  padding: 0 0.5rem;
  margin-bottom: 2rem;
}
.admin-sidebar__logo span {
  /* El sidebar es siempre oscuro sin importar el tema claro/oscuro del
     sitio: --color-accent-hover asume texto sobre fondo claro y quedaria
     casi invisible aca, por eso un verde fijo en vez de la variable. */
  color: #2fbf8f;
}
.admin-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}
.admin-sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.7rem;
  border-radius: var(--radius-control);
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.admin-sidebar__link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
.admin-sidebar__link.is-active {
  background: var(--color-accent);
  color: #fff;
}
.admin-sidebar__exit {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  padding: 0 0.5rem;
}
.admin-sidebar__exit:hover {
  color: #fff;
}

.admin-main {
  flex: 1;
  min-width: 0;
}
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.75rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 5;
}
.admin-topbar__env {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-topbar__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--color-ink-muted);
}

.admin-content {
  padding: 1.75rem;
  max-width: 1280px;
}

@media (max-width: 860px) {
  .admin-sidebar {
    width: 72px;
    padding: 1.25rem 0.5rem;
  }
  .admin-sidebar__logo,
  .admin-sidebar__link span,
  .admin-sidebar__exit {
    display: none;
  }
  .admin-sidebar__link {
    justify-content: center;
  }
}
</style>
