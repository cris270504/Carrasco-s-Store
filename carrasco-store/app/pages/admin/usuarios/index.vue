<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface AdminUser {
  id: string
  name: string
  email: string
  registeredAt: string
  orders: number
  totalSpent: number
  active: boolean
}

const { data: fetchedUsers, pending } = await useFetch<AdminUser[]>('/api/admin/users', {
  default: () => [],
})

const users = computed(() => fetchedUsers.value ?? [])

const search = ref('')
const filtered = computed(() => users.value.filter(u =>
  u.name.toLowerCase().includes(search.value.toLowerCase())
  || u.email.toLowerCase().includes(search.value.toLowerCase()),
))

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="users-page">
    <header class="page-header">
      <p class="page-header__eyebrow">Clientes</p>
      <h1>Usuarios</h1>
    </header>

    <div class="toolbar">
      <input v-model="search" type="text" placeholder="Buscar por nombre o correo..." class="toolbar__search">
    </div>

    <div class="panel">
      <p v-if="pending" class="users-page__empty">Cargando usuarios…</p>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Registrado</th>
            <th>Pedidos</th>
            <th>Total gastado</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filtered" :key="user.id">
            <td>
              <div class="users-page__customer">
                <span class="users-page__avatar">{{ user.name.charAt(0).toUpperCase() }}</span>
                <div>
                  <p class="users-page__name">{{ user.name }}</p>
                  <p class="users-page__email">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="users-page__muted">{{ formatDate(user.registeredAt) }}</td>
            <td class="admin-table__mono">{{ user.orders }}</td>
            <td class="admin-table__mono">S/ {{ user.totalSpent.toFixed(2) }}</td>
            <td>
              <span class="status-dot" :class="{ 'is-active': user.active }" />
              {{ user.active ? 'Activo' : 'Suspendido' }}
            </td>
            <td>
              <button type="button" class="btn btn-outline users-page__view" disabled title="Próximamente">Ver detalle</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="6" class="users-page__empty">Sin resultados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
}
.page-header__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.25rem;
}
.page-header h1 {
  font-size: 1.5rem;
}

.toolbar {
  margin-bottom: 1rem;
}
.toolbar__search {
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
  min-width: 280px;
  max-width: 100%;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.1rem;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.admin-table th {
  text-align: left;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ink-faint);
  padding: 0 0.6rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.admin-table td {
  padding: 0.7rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
}
.admin-table tr:last-child td {
  border-bottom: none;
}
.admin-table__mono {
  font-family: var(--font-mono);
}

.users-page__customer {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.users-page__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.85rem;
}
.users-page__name {
  margin: 0;
  font-weight: 600;
  font-size: 0.86rem;
}
.users-page__email {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 0.78rem;
}
.users-page__muted {
  color: var(--color-ink-muted);
  white-space: nowrap;
}
.users-page__empty {
  text-align: center;
  color: var(--color-ink-muted);
  padding: 2rem;
}
.users-page__view {
  font-size: 0.78rem;
  padding: 0.4rem 0.75rem;
  white-space: nowrap;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-ink-faint);
  margin-right: 0.35rem;
}
.status-dot.is-active {
  background: var(--color-success);
}
</style>
