<script setup lang="ts">
const request = useConfirmState()
const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => !!request.value)
useFocusTrap(dialogRef, isOpen)

function respond(value: boolean) {
  request.value?.resolve(value)
  request.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (!request.value) return
  if (event.key === 'Escape') respond(false)
  if (event.key === 'Enter') respond(true)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="request" class="confirm-overlay" @click.self="respond(false)">
        <div
          ref="dialogRef"
          class="confirm-dialog"
          :class="{ 'is-danger': request.variant === 'danger' }"
          role="alertdialog"
          aria-modal="true"
        >
          <span v-if="request.variant === 'danger'" class="confirm-dialog__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2 1 17h18L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
              <path d="M10 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
            </svg>
          </span>
          <h3 v-if="request.title">{{ request.title }}</h3>
          <p>{{ request.message }}</p>
          <div class="confirm-dialog__actions">
            <button v-if="!request.notice" type="button" class="btn btn-ghost" @click="respond(false)">
              {{ request.cancelLabel ?? 'Cancelar' }}
            </button>
            <button
              type="button"
              class="btn"
              :class="request.variant === 'danger' ? 'btn-danger' : 'btn-primary'"
              @click="respond(true)"
            >
              {{ request.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 17, 19, 0.5);
}
.confirm-dialog {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-hover);
  padding: 1.25rem;
}
.confirm-dialog.is-danger {
  border-top-color: var(--color-danger);
}
.confirm-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-danger-tint);
  color: var(--color-danger);
  margin-bottom: 0.7rem;
}
.confirm-dialog h3 {
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}
.confirm-dialog p {
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  margin: 0;
}
.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
