<script setup lang="ts">
import type { ProductFilters } from '~/composables/useProductFilters'

defineProps<{ filters: ProductFilters }>()
const emit = defineEmits<{ reset: [] }>()

const typeOptions = [
  { value: '', label: 'Todos' },
  { value: 'physical', label: 'Físicos' },
  { value: 'digital', label: 'Digitales' },
  { value: 'service', label: 'Servicios' },
] as const
</script>

<template>
  <aside class="filters">
    <div class="filters__header">
      <h2>Filtros</h2>
      <button type="button" class="btn btn-ghost" @click="emit('reset')">Limpiar</button>
    </div>

    <div class="filters__group">
      <span class="filters__label">Tipo</span>
      <div class="filters__chips">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          class="filters__chip"
          :class="{ 'is-active': filters.type === option.value }"
          @click="filters.type = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="filters__group">
      <label class="filters__label" for="brand">Marca</label>
      <input id="brand" v-model="filters.brand" type="text" placeholder="Ej. Seagate">
    </div>

    <div class="filters__group">
      <span class="filters__label">Precio (S/)</span>
      <div class="filters__price-range">
        <input v-model="filters.minPrice" type="number" min="0" placeholder="Mín">
        <span class="filters__price-dash">–</span>
        <input v-model="filters.maxPrice" type="number" min="0" placeholder="Máx">
      </div>
    </div>
  </aside>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: 1.1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  align-self: start;
  position: sticky;
  top: 1.5rem;
}
.filters__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.filters__header h2 {
  font-size: 1rem;
}
.filters__group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.filters__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.filters__chip {
  font-family: var(--font-body);
  font-size: 0.82rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}
.filters__chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.filters__chip.is-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}
.filters__group input[type='text'],
.filters__group input[type='number'] {
  font-family: var(--font-body);
  font-size: 0.88rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-bg);
  width: 100%;
}
.filters__group input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--color-surface);
}
.filters__price-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.filters__price-dash {
  color: var(--color-ink-faint);
}
</style>