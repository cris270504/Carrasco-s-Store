<script setup lang="ts">
import type { ProductFilters } from '~/composables/useProductFilters'

const props = defineProps<{ filters: ProductFilters }>()
const emit = defineEmits<{ reset: [] }>()
const { settings } = useStoreSettings()

const ALL_TYPE_OPTIONS = [
  { value: '', label: 'Todos', enabled: () => true },
  { value: 'physical', label: 'Físicos', enabled: (s: typeof settings.value) => s?.physicalEnabled !== false },
  { value: 'digital', label: 'Digitales', enabled: (s: typeof settings.value) => s?.digitalEnabled !== false },
  { value: 'service', label: 'Servicios', enabled: (s: typeof settings.value) => s?.serviceEnabled !== false },
] as const
// Oculta el chip de una linea de negocio desactivada en Configuracion — sin
// esto, el chip quedaba visible pero siempre devolvia cero resultados.
const typeOptions = computed(() => ALL_TYPE_OPTIONS.filter(o => o.enabled(settings.value)))

// Techo solo de referencia visual para el slider; los inputs numéricos
// aceptan cualquier valor y son los que realmente viajan en la query.
const SLIDER_MAX = 5000

const sliderMin = computed({
  get: () => Number(props.filters.minPrice) || 0,
  set: (val: number) => { props.filters.minPrice = val > 0 ? String(val) : '' },
})
const sliderMax = computed({
  get: () => props.filters.maxPrice ? Number(props.filters.maxPrice) : SLIDER_MAX,
  set: (val: number) => { props.filters.maxPrice = val < SLIDER_MAX ? String(val) : '' },
})

const activeFilterCount = computed(() => {
  return [props.filters.type, props.filters.brand, props.filters.minPrice, props.filters.maxPrice]
    .filter(Boolean).length
})
</script>

<template>
  <aside class="filters">
    <div class="filters__header">
      <h2>Filtros</h2>
      <button
        v-if="activeFilterCount > 0"
        type="button"
        class="btn btn-ghost"
        @click="emit('reset')"
      >
        Limpiar ({{ activeFilterCount }})
      </button>
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
      <input id="brand" v-model="filters.brand" type="text" placeholder="Buscar marca...">
    </div>

    <div class="filters__group">
      <span class="filters__label">Precio ({{ settings?.currencyCode || 'PEN' }})</span>
      <div class="filters__price-slider">
        <div class="filters__price-track">
          <div
            class="filters__price-fill"
            :style="{
              left: `${(sliderMin / SLIDER_MAX) * 100}%`,
              right: `${100 - (sliderMax / SLIDER_MAX) * 100}%`,
            }"
          />
        </div>
        <input
          v-model.number="sliderMin"
          type="range"
          min="0"
          :max="SLIDER_MAX"
          step="10"
        >
        <input
          v-model.number="sliderMax"
          type="range"
          min="0"
          :max="SLIDER_MAX"
          step="10"
        >
      </div>
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
  color: var(--color-ink);
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

.filters__price-slider {
  position: relative;
  height: 28px;
  margin-top: 0.2rem;
}
.filters__price-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  transform: translateY(-50%);
  background: var(--color-border-strong);
  border-radius: 999px;
}
.filters__price-fill {
  position: absolute;
  top: 0;
  height: 100%;
  background: var(--color-accent);
  border-radius: 999px;
}
.filters__price-slider input[type='range'] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 28px;
  margin: 0;
  background: transparent;
  appearance: none;
  pointer-events: none;
}
.filters__price-slider input[type='range']::-webkit-slider-thumb {
  appearance: none;
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  cursor: pointer;
  margin-top: 6px;
}
.filters__price-slider input[type='range']::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  cursor: pointer;
}
.filters__price-slider input[type='range']::-webkit-slider-runnable-track {
  background: transparent;
}
</style>