<script setup lang="ts">
const { toasts, dismiss } = useToast()

const icons = { info: 'ℹ', success: '✓', warning: '!', error: '✕' } as const
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`is-${toast.type}`">
          <span class="toast__icon">{{ icons[toast.type] }}</span>
          <p>{{ toast.message }}</p>
          <button type="button" class="toast__close" aria-label="Cerrar" @click="dismiss(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: min(360px, calc(100vw - 2rem));
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-card-hover);
  font-size: 0.85rem;
}
.toast p {
  margin: 0;
  flex: 1;
  color: var(--color-ink);
}
.toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
}
.toast.is-info .toast__icon { background: var(--color-accent); }
.toast.is-success .toast__icon { background: var(--color-success); }
.toast.is-warning .toast__icon { background: var(--color-service); }
.toast.is-error .toast__icon { background: var(--color-danger); }

.toast__close {
  border: none;
  background: none;
  color: var(--color-ink-faint);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}
.toast__close:hover {
  color: var(--color-ink);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
