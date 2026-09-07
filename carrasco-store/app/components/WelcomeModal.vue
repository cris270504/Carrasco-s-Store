<script setup lang="ts">
const user = useSupabaseUser()
const visible = ref(false)
const dialogRef = ref<HTMLElement | null>(null)
useFocusTrap(dialogRef, visible)

function storageKey(userId: string) {
  return `welcome-seen:${userId}`
}

if (import.meta.client) {
  watch(user, (current) => {
    if (!current) return
    // No mostrar la bienvenida encima del flujo de "nueva contraseña": la
    // sesion temporal de recuperacion tambien pone `user`, y se solaparia
    // con el formulario de app/pages/restablecer-password.vue.
    if (sessionStorage.getItem('password-recovery')) return

    const key = storageKey(current.id)
    if (localStorage.getItem(key)) return

    localStorage.setItem(key, '1')
    visible.value = true
  }, { immediate: true })
}

function close() {
  visible.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="welcome-fade">
      <div v-if="visible" class="welcome-overlay" @click.self="close">
        <div ref="dialogRef" class="welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <span class="welcome-dialog__icon" aria-hidden="true">👋</span>
          <h3 id="welcome-title">¡Bienvenido a Carrasco Store!</h3>
          <p>
            Tu cuenta ya está lista. Explora el catálogo de productos físicos, licencias digitales
            y servicios técnicos, todo desde un solo carrito.
          </p>
          <button type="button" class="btn btn-primary welcome-dialog__close" @click="close">
            Empezar a explorar
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.welcome-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 17, 19, 0.5);
}
.welcome-dialog {
  width: 100%;
  max-width: 380px;
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-accent);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-hover);
  padding: 2rem 1.75rem;
}
.welcome-dialog__icon {
  display: block;
  font-size: 2rem;
  margin-bottom: 0.75rem;
}
.welcome-dialog h3 {
  font-size: 1.2rem;
  margin-bottom: 0.6rem;
}
.welcome-dialog p {
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  margin: 0;
}
.welcome-dialog__close {
  width: 100%;
  margin-top: 1.5rem;
}

.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: opacity 0.15s ease;
}
.welcome-fade-enter-from,
.welcome-fade-leave-to {
  opacity: 0;
}
</style>
