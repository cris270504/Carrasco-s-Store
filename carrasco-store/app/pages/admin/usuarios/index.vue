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

// TODO: reemplazar por datos reales cuando exista GET /api/admin/users.
const { data: fetchedUsers } = await useFetch<AdminUser[]>('/api/admin/users', {
  default: () => [],
})

const mockUsers: AdminUser[] = [
  { id: 'b25ba771', name: 'Cristopher Carrasco', email: 'cristopher270504@gmail.com', registeredAt: '2026-08-05', orders: 3, totalSpent: 915.00, active: true },
  { id: 'c36cb882', name: 'Ana Torres', email: 'ana.torres@example.com', registeredAt: '2026-07-28', orders: 1, totalSpent: 310.00, active: true },
  { id: 'd47dc993', name: 'Luis Ramírez', email: 'luis.ramirez@example.com', registeredAt: '2026-07-20', orders: 2, totalSpent: 179.80, active: true },
  { id: 'e58eda04', name: 'María Quispe', email: 'maria.quispe@example.com', registeredAt: '2026-07-15', orders: 5, totalSpent: 3120.00, active: true },
  { id: 'f69feb15', name: 'Jorge Salinas', email: 'jorge.salinas@example.com', registeredAt: '2026-06-30', orders: 1, totalSpent: 89.90, active: false },
]

const users = computed(() => fetchedUsers.value?.length ? fetchedUsers.value : mockUsers)

const search = ref('')
const filtered = computed(() => users.value.filter(u =>
  u.name.toLowerCase().includes(search.value.toLowerCase())
  || u.email.toLowerCase().includes(search.value.toLowerCase()),
))
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
      <table class="admin-table">
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
                <span class="users-page__avatar">{{ user.name.charAt(0) }}</span>
                <div>
                  <p class="users-page__name">{{ user.name }}</p>
                  <p class="users-page__email">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="users-page__muted">{{ user.registeredAt }}</td>
            <td class="admin-table__mono">{{ user.orders }}</td>
            <td class="admin-table__mono">S/ {{ user.totalSpent.toFixed(2) }}</td>
            <td>
              <span class="status-dot" :class="{ 'is-active': user.active }" />
              {{ user.active ? 'Activo' : 'Inactivo' }}
            </td>
            <td>
              <button type="button" class="btn btn-outline users-page__view">Ver detalle</button>
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
