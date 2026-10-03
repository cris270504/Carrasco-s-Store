<script setup lang="ts">
// Campo de contraseña con botón de ojo para mostrar u ocultar lo escrito.
// Los atributos (required, placeholder, autocomplete) pasan al <input>.
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })
defineProps<{ id: string, invalid?: boolean }>()

const visible = ref(false)
</script>

<template>
  <div class="password-input">
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="visible ? 'text' : 'password'"
      :class="{ 'is-invalid': invalid }"
    >
    <button
      type="button"
      class="password-input__toggle"
      :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
        <line v-if="visible" x1="3" y1="3" x2="21" y2="21" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.password-input {
  position: relative;
}
/* Mismo aspecto que el resto de campos de auth: los estilos scoped de la
   pagina no llegan a este <input> interno. */
.password-input input {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.92rem;
  padding: 0.65rem 2.6rem 0.65rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-bg);
  color: var(--color-ink);
}
.password-input input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--color-surface);
}
.password-input input.is-invalid {
  border-color: var(--color-danger);
}
.password-input__toggle {
  position: absolute;
  top: 50%;
  right: 0.45rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: none;
  color: var(--color-ink-muted);
  cursor: pointer;
}
.password-input__toggle:hover,
.password-input__toggle:focus-visible {
  color: var(--color-accent);
  outline: none;
}
</style>
