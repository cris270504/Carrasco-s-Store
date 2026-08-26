<script setup lang="ts">
import type { StoreSettings } from '~/composables/useStoreSettings'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()

const { data: initialSettings, pending: loading } = await useFetch<StoreSettings>('/api/settings')

const rate = ref('15')
const lastUpdated = ref<string | null>(null)

watch(initialSettings, (value) => {
  if (!value) return
  rate.value = value.shippingFlatRate.toFixed(2)
  lastUpdated.value = value.updatedAt
}, { immediate: true })

const parsedRate = computed(() => Number(rate.value))
const isValid = computed(() => Number.isFinite(parsedRate.value) && parsedRate.value >= 0)

const saving = ref(false)

async function handleSave() {
  if (!isValid.value) {
    toast.error('Ingresa un costo de envío válido (0 o mayor).')
    return
  }

  saving.value = true
  try {
    const updated = await $fetch<StoreSettings>('/api/admin/settings', {
      method: 'PATCH',
      body: { shippingFlatRate: parsedRate.value },
    })
    rate.value = updated.shippingFlatRate.toFixed(2)
    lastUpdated.value = updated.updatedAt
    toast.success('Costo de envío actualizado.')
  }
  catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.error(fetchError?.data?.statusMessage || 'No se pudo guardar la configuración.')
  }
  finally {
    saving.value = false
  }
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <p class="page-header__eyebrow">Configuración</p>
      <h1>Envíos</h1>
    </header>

    <p v-if="loading" class="settings-page__loading">Cargando configuración…</p>

    <div v-else class="settings-layout">
      <form class="panel settings-card" @submit.prevent="handleSave">
        <div class="settings-card__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M2.5 6.5h11v9h-11z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M13.5 10h4l3 3v2.5h-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <circle cx="6.5" cy="17.5" r="1.8" stroke="currentColor" stroke-width="1.6" />
            <circle cx="17" cy="17.5" r="1.8" stroke="currentColor" stroke-width="1.6" />
          </svg>
        </div>

        <h2>Costo de envío</h2>
        <p class="settings-card__desc">
          Tarifa fija que se cobra una sola vez por pedido cuando el carrito incluye al menos un
          producto físico. Los pedidos compuestos solo por licencias digitales o servicios
          técnicos no pagan envío.
        </p>

        <div class="field">
          <label for="shipping-rate">Costo fijo de envío</label>
          <div class="currency-input" :class="{ 'is-invalid': !isValid }">
            <span class="currency-input__prefix">S/</span>
            <input
              id="shipping-rate"
              v-model="rate"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              required
            >
          </div>
          <p v-if="!isValid" class="field__hint field__hint--error">Debe ser un número mayor o igual a 0.</p>
        </div>

        <button type="submit" class="btn btn-primary settings-card__submit" :disabled="saving || !isValid">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>

        <p v-if="lastUpdated" class="settings-card__meta">
          Última actualización: {{ formatDate(lastUpdated) }}
        </p>
      </form>

      <aside class="panel settings-preview">
        <h3>Vista previa</h3>
        <p class="settings-preview__hint">Así se verá reflejado en el carrito de tus clientes.</p>

        <div class="settings-preview__row">
          <span class="settings-preview__badge is-physical">Con producto físico</span>
          <strong>{{ isValid ? `S/ ${parsedRate.toFixed(2)}` : '—' }}</strong>
        </div>
        <div class="settings-preview__row">
          <span class="settings-preview__badge is-digital">Solo digital / servicio</span>
          <strong>Gratis</strong>
        </div>
      </aside>
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

.settings-page__loading {
  color: var(--color-ink-muted);
}

.settings-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.25rem;
  align-items: start;
  max-width: 760px;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
}

.settings-card {
  padding: 1.75rem;
  border-top: 3px solid var(--color-accent);
}
.settings-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-accent-tint);
  color: var(--color-accent);
  margin-bottom: 0.9rem;
}
.settings-card h2 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.settings-card__desc {
  color: var(--color-ink-muted);
  font-size: 0.88rem;
  line-height: 1.55;
  margin: 0 0 1.4rem;
}

.field {
  margin-bottom: 1.1rem;
}
.field label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  margin-bottom: 0.4rem;
}
.field__hint {
  font-size: 0.78rem;
  color: var(--color-ink-faint);
  margin: 0.4rem 0 0;
}
.field__hint--error {
  color: var(--color-danger);
}

.currency-input {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-bg);
  overflow: hidden;
  max-width: 220px;
}
.currency-input:focus-within {
  border-color: var(--color-accent);
}
.currency-input.is-invalid {
  border-color: var(--color-danger);
}
.currency-input__prefix {
  padding: 0 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-ink-faint);
  border-right: 1px solid var(--color-border-strong);
  align-self: stretch;
  display: flex;
  align-items: center;
}
.currency-input input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  padding: 0.6rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-ink);
}
.currency-input input:focus {
  outline: none;
}

.settings-card__submit {
  margin-top: 0.3rem;
}
.settings-card__meta {
  margin: 1rem 0 0;
  font-size: 0.78rem;
  color: var(--color-ink-faint);
}

.settings-preview {
  padding: 1.25rem;
  position: sticky;
  top: 1.5rem;
}
.settings-preview h3 {
  font-size: 0.95rem;
  margin-bottom: 0.3rem;
}
.settings-preview__hint {
  font-size: 0.8rem;
  color: var(--color-ink-muted);
  margin: 0 0 1.1rem;
}
.settings-preview__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.7rem 0;
  border-top: 1px solid var(--color-border);
  font-size: 0.85rem;
}
.settings-preview__row:first-of-type {
  border-top: none;
}
.settings-preview__badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
}
.settings-preview__badge.is-physical { background: var(--color-physical-tint); color: var(--color-physical-ink); }
.settings-preview__badge.is-digital { background: var(--color-digital-tint); color: var(--color-digital-ink); }

@media (max-width: 720px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  .settings-preview {
    position: static;
  }
}
</style>
