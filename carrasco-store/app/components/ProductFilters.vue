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

// Topes configurables desde /admin/configuracion (pestaña Reglas de
// negocio); 0/2000 son solo el fallback mientras no haya fila guardada.
const catalogMin = computed(() => settings.value?.catalogMinPrice ?? 0)
const catalogMax = computed(() => settings.value?.catalogMaxPrice ?? 2000)
const catalogStep = computed(() => settings.value?.catalogPriceStep ?? 25)

// Tramos de precio como casillas (una sola activa a la vez). Cada tramo va de
// `from` a `to`; el ultimo tramo es abierto (`to: null`, "Desde").
interface PriceBucket { from: number, to: number | null }
const priceBuckets = computed<PriceBucket[]>(() => {
  const min = catalogMin.value
  const max = catalogMax.value
  const step = catalogStep.value
  const buckets: PriceBucket[] = []
  for (let i = 0; min + i * step < max; i++) {
    const from = min + i * step
    buckets.push({ from, to: Math.min(from + step, max) })
  }
  buckets.push({ from: max, to: null })
  return buckets
})

// Estado derivado de filters.minPrice/maxPrice: asi la URL sigue siendo la
// fuente de verdad y el filtro queda activo al recargar o compartir el enlace.
const activeBucket = computed(() => {
  const from = Number(props.filters.minPrice) || catalogMin.value
  const to = props.filters.maxPrice ? Number(props.filters.maxPrice) : null
  return priceBuckets.value.find(b => b.from === from && b.to === to) ?? null
})
function isBucketActive(bucket: PriceBucket) {
  return activeBucket.value?.from === bucket.from
}
function toggleBucket(bucket: PriceBucket) {
  if (isBucketActive(bucket)) {
    props.filters.minPrice = ''
    props.filters.maxPrice = ''
    return
  }
  props.filters.minPrice = bucket.from > catalogMin.value ? String(bucket.from) : ''
  props.filters.maxPrice = bucket.to === null ? '' : String(bucket.to)
}
function bucketLabel(bucket: PriceBucket) {
  const currency = settings.value?.currencyCode
  if (bucket.to === null) return `Desde ${formatMoney(bucket.from, currency)}`
  if (bucket.from === catalogMin.value) return `Hasta ${formatMoney(bucket.to, currency)}`
  return `${formatMoney(bucket.from, currency)} – ${formatMoney(bucket.to, currency)}`
}

// Marca: filters.brand guarda una lista separada por comas (igual formato
// que espera el query de /api/products), pero la UI es de chips
// seleccionables, no texto libre — este computed traduce entre ambos.
const selectedBrands = computed<string[]>({
  get: () => props.filters.brand ? props.filters.brand.split(',').filter(Boolean) : [],
  set: (list) => { props.filters.brand = list.join(',') },
})
function toggleBrand(brand: string) {
  const current = selectedBrands.value
  selectedBrands.value = current.includes(brand) ? current.filter(b => b !== brand) : [...current, brand]
}

const { data: availableBrands } = await useFetch<string[]>('/api/products/brands', { default: () => [] })
const BRANDS_VISIBLE = 5
const showAllBrands = ref(false)
const visibleBrands = computed(() => showAllBrands.value ? availableBrands.value : availableBrands.value.slice(0, BRANDS_VISIBLE))

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
      <span class="filters__label">Marca</span>
      <p v-if="availableBrands.length === 0" class="filters__empty">No hay marcas registradas.</p>
      <template v-else>
        <div class="filters__chips">
          <button
            v-for="brand in visibleBrands"
            :key="brand"
            type="button"
            class="filters__chip"
            :class="{ 'is-active': selectedBrands.includes(brand) }"
            @click="toggleBrand(brand)"
          >
            {{ brand }}
          </button>
        </div>
        <button v-if="!showAllBrands && availableBrands.length > BRANDS_VISIBLE" type="button" class="filters__more" @click="showAllBrands = true">
          Ver más ({{ availableBrands.length - BRANDS_VISIBLE }})
        </button>
      </template>
    </div>

    <div class="filters__group">
      <span class="filters__label">Precio ({{ settings?.currencyCode || 'PEN' }})</span>
      <ul class="filters__prices">
        <li v-for="bucket in priceBuckets" :key="bucket.from">
          <label class="filters__price-option">
            <input
              type="checkbox"
              :checked="isBucketActive(bucket)"
              @change="toggleBucket(bucket)"
            >
            <span>{{ bucketLabel(bucket) }}</span>
          </label>
        </li>
      </ul>
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
.filters__prices {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0.35rem 0.25rem 0;
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.filters__price-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.2rem;
  font-size: 0.86rem;
  color: var(--color-ink);
  cursor: pointer;
}
.filters__price-option:hover {
  color: var(--color-accent);
}
.filters__price-option input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--color-accent);
  cursor: pointer;
}
.filters__more {
  align-self: flex-start;
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-accent);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.filters__more:hover {
  text-decoration: underline;
}
.filters__empty {
  font-size: 0.82rem;
  color: var(--color-ink-muted);
  margin: 0;
}

</style>