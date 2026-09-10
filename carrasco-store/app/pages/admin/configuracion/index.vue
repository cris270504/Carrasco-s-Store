<script setup lang="ts">
import type { StoreSettings } from '~/composables/useStoreSettings'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()

const { data: initial, pending: loading, refresh } = await useFetch<StoreSettings>('/api/settings')

const form = reactive({
  shippingFlatRate: '15',
  whatsappNumber: '',
  whatsappCta: '',
  offerCountdownEndsAt: '',
  offerCountdownTitle: '',
  offerCountdownUrl: '',
})
const lastUpdated = ref<string | null>(null)

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  // datetime-local espera 'YYYY-MM-DDTHH:mm' en hora local
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

watch(initial, (v) => {
  if (!v) return
  form.shippingFlatRate = v.shippingFlatRate.toFixed(2)
  form.whatsappNumber = v.whatsappNumber ?? ''
  form.whatsappCta = v.whatsappCta ?? ''
  form.offerCountdownEndsAt = toLocalInput(v.offerCountdownEndsAt)
  form.offerCountdownTitle = v.offerCountdownTitle ?? ''
  form.offerCountdownUrl = v.offerCountdownUrl ?? ''
  lastUpdated.value = v.updatedAt
}, { immediate: true })

const savingSection = ref<string | null>(null)

async function save(section: string, body: Record<string, unknown>) {
  if (savingSection.value) return
  savingSection.value = section
  try {
    const updated = await $fetch<StoreSettings>('/api/admin/settings', { method: 'PATCH', body })
    lastUpdated.value = updated.updatedAt
    await refresh()
    toast.success('Configuración guardada.')
  }
  catch (err) {
    toast.error((err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'No se pudo guardar.')
  }
  finally {
    savingSection.value = null
  }
}

const shippingValid = computed(() => {
  const n = Number(form.shippingFlatRate)
  return Number.isFinite(n) && n >= 0
})

function saveShipping() {
  if (!shippingValid.value) {
    toast.error('Ingresa un costo de envío válido (0 o mayor).')
    return
  }
  save('shipping', { shippingFlatRate: Number(form.shippingFlatRate) })
}

function saveWhatsapp() {
  save('whatsapp', {
    whatsappNumber: form.whatsappNumber.trim(),
    whatsappCta: form.whatsappCta.trim(),
  })
}

function saveCountdown() {
  save('countdown', {
    offerCountdownEndsAt: form.offerCountdownEndsAt ? new Date(form.offerCountdownEndsAt).toISOString() : null,
    offerCountdownTitle: form.offerCountdownTitle.trim(),
    offerCountdownUrl: form.offerCountdownUrl.trim(),
  })
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
      <h1>Configuración de la tienda</h1>
    </header>

    <p v-if="loading" class="settings-page__loading">Cargando configuración…</p>

    <div v-else class="settings-stack">
      <!-- Envío -->
      <form class="panel settings-card" @submit.prevent="saveShipping">
        <h2>Costo de envío</h2>
        <p class="settings-card__desc">
          Tarifa fija que se cobra una vez por pedido cuando hay al menos un producto físico.
          Los pedidos solo digitales o de servicios no pagan envío.
        </p>
        <div class="field">
          <label for="shipping-rate">Costo fijo (S/)</label>
          <input id="shipping-rate" v-model="form.shippingFlatRate" type="number" min="0" step="0.01" required>
          <p v-if="!shippingValid" class="field__err">Debe ser un número mayor o igual a 0.</p>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="savingSection === 'shipping' || !shippingValid">
          {{ savingSection === 'shipping' ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>

      <!-- WhatsApp -->
      <form class="panel settings-card" @submit.prevent="saveWhatsapp">
        <h2>Botón flotante de WhatsApp</h2>
        <p class="settings-card__desc">
          Botón que aparece en todas las páginas de la tienda para escribirte por WhatsApp.
          Déjalo vacío para ocultarlo. Este número es solo para el botón, no para los avisos de venta.
        </p>
        <div class="field">
          <label for="wa-number">Número (formato internacional)</label>
          <input id="wa-number" v-model="form.whatsappNumber" type="tel" placeholder="Ej. 51999888777 o 999888777">
          <p class="field__hint">Si pones 9 dígitos se asume Perú (+51).</p>
        </div>
        <div class="field">
          <label for="wa-cta">Mensaje precargado (opcional)</label>
          <input id="wa-cta" v-model="form.whatsappCta" type="text" maxlength="200" placeholder="Hola, quiero información sobre…">
        </div>
        <button type="submit" class="btn btn-primary" :disabled="savingSection === 'whatsapp'">
          {{ savingSection === 'whatsapp' ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>

      <!-- Contador de ofertas -->
      <form class="panel settings-card" @submit.prevent="saveCountdown">
        <h2>Contador de ofertas (home)</h2>
        <p class="settings-card__desc">
          Banda con cuenta regresiva en la página de inicio. Se muestra mientras la fecha límite
          esté en el futuro y se oculta sola al vencer. Deja la fecha vacía para no mostrarla.
        </p>
        <div class="field">
          <label for="oc-title">Título</label>
          <input id="oc-title" v-model="form.offerCountdownTitle" type="text" maxlength="120" placeholder="Ofertas de la semana">
        </div>
        <div class="field">
          <label for="oc-date">Fecha y hora límite</label>
          <input id="oc-date" v-model="form.offerCountdownEndsAt" type="datetime-local">
        </div>
        <div class="field">
          <label for="oc-url">Enlace del botón "Ver ofertas" (opcional)</label>
          <input id="oc-url" v-model="form.offerCountdownUrl" type="text" placeholder="/catalogo?type=digital">
          <p class="field__hint">Debe empezar con "/" o "https://". Por defecto: /catalogo</p>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="savingSection === 'countdown'">
          {{ savingSection === 'countdown' ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>

      <p v-if="lastUpdated" class="settings-page__meta">
        Última actualización: {{ formatDate(lastUpdated) }}
      </p>
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

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 620px;
}

.panel {
  background: var(--color-surface);
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
.settings-card {
  padding: 1.5rem;
}
.settings-card h2 {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 0.4rem;
}
.settings-card__desc {
  color: var(--color-ink-muted);
  font-size: 0.86rem;
  line-height: 1.55;
  margin: 0 0 1.2rem;
}

.field {
  margin-bottom: 1rem;
}
.field label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  margin-bottom: 0.35rem;
}
.field input {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.9rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
}
.field input:focus {
  outline: none;
  border-color: var(--color-accent);
}
.field__hint {
  font-size: 0.76rem;
  color: var(--color-ink-faint);
  margin: 0.35rem 0 0;
}
.field__err {
  font-size: 0.76rem;
  color: var(--color-danger);
  margin: 0.35rem 0 0;
}

.settings-page__meta {
  font-size: 0.78rem;
  color: var(--color-ink-faint);
  margin: 0;
}
</style>
