<script setup lang="ts">
import type { HomeTrustBadge, LegalSection, StoreSettings } from '~/composables/useStoreSettings'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface MessageTemplate { key: string, subject: string, body: string, updatedAt: string }

const toast = useToast()

const { data: initial, pending: loading, refresh } = await useFetch<StoreSettings>('/api/settings')
const { data: templatesData, refresh: refreshTemplates } = await useFetch<MessageTemplate[]>('/api/admin/message-templates')

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'marca', label: 'Marca' },
  { id: 'reglas', label: 'Reglas de negocio' },
  { id: 'lineas', label: 'Líneas de negocio' },
  { id: 'contacto', label: 'Contacto y redes' },
  { id: 'inicio', label: 'Inicio' },
  { id: 'legal', label: 'Textos legales' },
  { id: 'plantillas', label: 'Plantillas de correo' },
] as const
const activeTab = ref<typeof TABS[number]['id']>('general')

const form = reactive({
  // General (ya existia)
  shippingFlatRate: '15',
  whatsappNumber: '',
  whatsappCta: '',
  offerCountdownEndsAt: '',
  offerCountdownTitle: '',
  offerCountdownUrl: '',
  // Marca
  storeName: 'Carrasco Store',
  logoUrl: '',
  faviconUrl: '',
  // Reglas de negocio
  igvPercent: '18',
  lowStockThreshold: '5',
  mpMinAmount: '10',
  currencyCode: 'PEN',
  currencyCustom: '',
  catalogMinPrice: '0',
  catalogMaxPrice: '2000',
  // Lineas de negocio
  physicalEnabled: true,
  digitalEnabled: true,
  serviceEnabled: true,
  // Contacto
  ownerWhatsappNumbers: '',
  senderEmail: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  // Inicio
  homeHeroBadge: '',
  homeHeroTitle: '',
  homeHeroSubtitle: '',
})
const trustBadges = ref<HomeTrustBadge[]>([])
const legalTerms = ref<LegalSection[]>([])
const legalPrivacy = ref<LegalSection[]>([])

const lastUpdated = ref<string | null>(null)
const CURRENCY_OPTIONS = ['PEN', 'USD', 'MXN', 'COP', 'CLP', 'ARS']

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
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

  form.storeName = v.storeName
  form.logoUrl = v.logoUrl ?? ''
  form.faviconUrl = v.faviconUrl ?? ''

  form.igvPercent = (v.igvRate * 100).toFixed(2).replace(/\.00$/, '')
  form.lowStockThreshold = String(v.lowStockThreshold)
  form.mpMinAmount = v.mpMinAmount.toFixed(2)
  form.currencyCode = CURRENCY_OPTIONS.includes(v.currencyCode) ? v.currencyCode : 'otra'
  form.currencyCustom = CURRENCY_OPTIONS.includes(v.currencyCode) ? '' : v.currencyCode
  form.catalogMinPrice = v.catalogMinPrice.toFixed(2)
  form.catalogMaxPrice = v.catalogMaxPrice.toFixed(2)

  form.physicalEnabled = v.physicalEnabled
  form.digitalEnabled = v.digitalEnabled
  form.serviceEnabled = v.serviceEnabled

  form.ownerWhatsappNumbers = v.ownerWhatsappNumbers ?? ''
  form.senderEmail = v.senderEmail ?? ''
  form.facebookUrl = v.facebookUrl ?? ''
  form.instagramUrl = v.instagramUrl ?? ''
  form.tiktokUrl = v.tiktokUrl ?? ''

  form.homeHeroBadge = v.homeHeroBadge ?? ''
  form.homeHeroTitle = v.homeHeroTitle ?? ''
  form.homeHeroSubtitle = v.homeHeroSubtitle ?? ''
  trustBadges.value = v.homeTrustBadges?.length ? v.homeTrustBadges.map(b => ({ ...b })) : [{ icon: 'shield', text: '' }]

  legalTerms.value = v.legalTermsSections?.length ? v.legalTermsSections.map(s => ({ ...s })) : []
  legalPrivacy.value = v.legalPrivacySections?.length ? v.legalPrivacySections.map(s => ({ ...s })) : []

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

// ---- General (ya existia) ----
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
  save('whatsapp', { whatsappNumber: form.whatsappNumber.trim(), whatsappCta: form.whatsappCta.trim() })
}
function saveCountdown() {
  save('countdown', {
    offerCountdownEndsAt: form.offerCountdownEndsAt ? new Date(form.offerCountdownEndsAt).toISOString() : null,
    offerCountdownTitle: form.offerCountdownTitle.trim(),
    offerCountdownUrl: form.offerCountdownUrl.trim(),
  })
}

// ---- Marca ----
function saveMarca() {
  if (!form.storeName.trim()) {
    toast.error('El nombre de la tienda no puede estar vacío.')
    return
  }
  save('marca', { storeName: form.storeName.trim(), logoUrl: form.logoUrl.trim(), faviconUrl: form.faviconUrl.trim() })
}

// ---- Reglas de negocio ----
const igvValid = computed(() => {
  const n = Number(form.igvPercent)
  return Number.isFinite(n) && n >= 0 && n <= 100
})
const catalogPriceValid = computed(() => {
  const min = Number(form.catalogMinPrice)
  const max = Number(form.catalogMaxPrice)
  return Number.isFinite(min) && min >= 0 && Number.isFinite(max) && max > min
})
function saveReglas() {
  if (!igvValid.value) {
    toast.error('El IGV debe ser un porcentaje entre 0 y 100.')
    return
  }
  const code = form.currencyCode === 'otra' ? form.currencyCustom.trim().toUpperCase() : form.currencyCode
  if (!/^[A-Z]{3}$/.test(code)) {
    toast.error('El código de moneda debe tener 3 letras (ej. PEN, USD).')
    return
  }
  if (!catalogPriceValid.value) {
    toast.error('El rango de precio del filtro no es válido: el mínimo debe ser menor al máximo.')
    return
  }
  save('reglas', {
    igvRate: Number(form.igvPercent) / 100,
    lowStockThreshold: Number(form.lowStockThreshold),
    mpMinAmount: Number(form.mpMinAmount),
    currencyCode: code,
    catalogMinPrice: Number(form.catalogMinPrice),
    catalogMaxPrice: Number(form.catalogMaxPrice),
  })
}

// ---- Lineas de negocio ----
function saveLineas() {
  save('lineas', {
    physicalEnabled: form.physicalEnabled,
    digitalEnabled: form.digitalEnabled,
    serviceEnabled: form.serviceEnabled,
  })
}

// ---- Contacto ----
function saveContacto() {
  save('contacto', {
    ownerWhatsappNumbers: form.ownerWhatsappNumbers.trim(),
    senderEmail: form.senderEmail.trim(),
    facebookUrl: form.facebookUrl.trim(),
    instagramUrl: form.instagramUrl.trim(),
    tiktokUrl: form.tiktokUrl.trim(),
  })
}

// ---- Inicio ----
function addTrustBadge() {
  if (trustBadges.value.length >= 4) return
  trustBadges.value.push({ icon: 'shield', text: '' })
}
function removeTrustBadge(i: number) {
  trustBadges.value.splice(i, 1)
}
function saveInicio() {
  save('inicio', {
    homeHeroBadge: form.homeHeroBadge.trim(),
    homeHeroTitle: form.homeHeroTitle.trim(),
    homeHeroSubtitle: form.homeHeroSubtitle.trim(),
    homeTrustBadges: trustBadges.value.filter(b => b.text.trim()).map(b => ({ icon: b.icon, text: b.text.trim() })),
  })
}

// ---- Textos legales ----
function addSection(list: LegalSection[]) {
  list.push({ title: '', body: '' })
}
function removeSection(list: LegalSection[], i: number) {
  list.splice(i, 1)
}
function saveLegal(kind: 'terms' | 'privacy') {
  const list = kind === 'terms' ? legalTerms.value : legalPrivacy.value
  const field = kind === 'terms' ? 'legalTermsSections' : 'legalPrivacySections'
  save(`legal-${kind}`, { [field]: list.filter(s => s.title.trim() || s.body.trim()) })
}

// ---- Plantillas de correo ----
function varToken(name: string) {
  return `{{${name}}}`
}
const TEMPLATE_INFO: Record<string, { label: string, vars: string[], defaultSubject: string }> = {
  buyer_confirmation_email: { label: 'Confirmación de compra (al cliente)', vars: ['orderShortId', 'itemsText', 'total', 'storeName'], defaultSubject: 'Confirmación de tu compra #{{orderShortId}}' },
  license_delivery_email: { label: 'Entrega de licencia digital', vars: ['productName', 'code', 'storeName'], defaultSubject: 'Tu licencia: {{productName}}' },
}
const templateForms = reactive<Record<string, { subject: string, body: string }>>({
  buyer_confirmation_email: { subject: '', body: '' },
  license_delivery_email: { subject: '', body: '' },
})
watch(templatesData, (list) => {
  for (const key of Object.keys(templateForms)) {
    const saved = list?.find(t => t.key === key)
    templateForms[key] = { subject: saved?.subject ?? '', body: saved?.body ?? '' }
  }
}, { immediate: true })

const savingTemplate = ref<string | null>(null)
async function saveTemplate(key: string) {
  const tpl = templateForms[key]
  if (!tpl.subject.trim() || !tpl.body.trim()) {
    toast.error('El asunto y el cuerpo son obligatorios.')
    return
  }
  savingTemplate.value = key
  try {
    await $fetch(`/api/admin/message-templates/${key}`, { method: 'PATCH', body: tpl })
    await refreshTemplates()
    toast.success('Plantilla guardada.')
  }
  catch (err) {
    toast.error((err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'No se pudo guardar.')
  }
  finally {
    savingTemplate.value = null
  }
}
async function resetTemplate(key: string) {
  savingTemplate.value = key
  try {
    await $fetch(`/api/admin/message-templates/${key}`, { method: 'DELETE' })
    await refreshTemplates()
    toast.success('Plantilla restablecida al texto por defecto.')
  }
  catch {
    toast.error('No se pudo restablecer.')
  }
  finally {
    savingTemplate.value = null
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
      <h1>Configuración de la tienda</h1>
      <p class="page-header__desc">Personaliza la tienda sin tocar código: marca, reglas de negocio, contacto y contenido.</p>
    </header>

    <nav class="tabs" aria-label="Secciones de configuración">
      <button
        v-for="tab in TABS" :key="tab.id" type="button"
        class="tabs__btn" :class="{ 'is-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <p v-if="loading" class="settings-page__loading">Cargando configuración…</p>

    <div v-else class="settings-stack">
      <!-- General -->
      <div v-show="activeTab === 'general'" class="tab-panel">
        <form class="panel settings-card" @submit.prevent="saveShipping">
          <h2>Costo de envío</h2>
          <p class="settings-card__desc">Tarifa fija que se cobra una vez por pedido cuando hay al menos un producto físico.</p>
          <div class="field">
            <label for="shipping-rate">Costo fijo</label>
            <input id="shipping-rate" v-model="form.shippingFlatRate" type="number" min="0" step="0.01" required>
            <p v-if="!shippingValid" class="field__err">Debe ser un número mayor o igual a 0.</p>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'shipping' || !shippingValid">
            {{ savingSection === 'shipping' ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>

        <form class="panel settings-card" @submit.prevent="saveWhatsapp">
          <h2>Botón flotante de WhatsApp</h2>
          <p class="settings-card__desc">Botón que aparece en toda la tienda. Déjalo vacío para ocultarlo.</p>
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

        <form class="panel settings-card" @submit.prevent="saveCountdown">
          <h2>Contador de ofertas (inicio)</h2>
          <p class="settings-card__desc">Banda con cuenta regresiva en la página de inicio. Deja la fecha vacía para no mostrarla.</p>
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
          </div>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'countdown'">
            {{ savingSection === 'countdown' ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </div>

      <!-- Marca -->
      <div v-show="activeTab === 'marca'" class="tab-panel">
        <form class="panel settings-card" @submit.prevent="saveMarca">
          <h2>Identidad de la tienda</h2>
          <p class="settings-card__desc">Nombre, logo y favicon. Se usan en el encabezado, el título de la pestaña y las redes sociales.</p>
          <div class="field">
            <label for="store-name">Nombre de la tienda</label>
            <input id="store-name" v-model="form.storeName" type="text" maxlength="80" required>
          </div>
          <div class="field">
            <label for="logo-url">URL del logo (opcional)</label>
            <input id="logo-url" v-model="form.logoUrl" type="text" placeholder="https://…">
            <p class="field__hint">Si lo dejas vacío, se muestra el nombre como texto.</p>
          </div>
          <div class="field">
            <label for="favicon-url">URL del favicon (opcional)</label>
            <input id="favicon-url" v-model="form.faviconUrl" type="text" placeholder="https://…">
          </div>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'marca'">
            {{ savingSection === 'marca' ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </div>

      <!-- Reglas de negocio -->
      <div v-show="activeTab === 'reglas'" class="tab-panel">
        <form class="panel settings-card" @submit.prevent="saveReglas">
          <h2>Impuestos, stock y pagos</h2>
          <p class="settings-card__desc">El IGV ya está incluido en el precio mostrado de cada producto; esto solo cambia cómo se descompone en el resumen.</p>
          <div class="field">
            <label for="igv">IGV (%)</label>
            <input id="igv" v-model="form.igvPercent" type="number" min="0" max="100" step="0.01" required>
            <p v-if="!igvValid" class="field__err">Debe ser un porcentaje entre 0 y 100.</p>
          </div>
          <div class="field">
            <label for="low-stock">Umbral de stock bajo</label>
            <input id="low-stock" v-model="form.lowStockThreshold" type="number" min="0" step="1" required>
            <p class="field__hint">Productos físicos con esta cantidad o menos aparecen en la alerta del dashboard.</p>
          </div>
          <div class="field">
            <label for="mp-min">Monto mínimo de pago con Mercado Pago</label>
            <input id="mp-min" v-model="form.mpMinAmount" type="number" min="0" step="0.01" required>
          </div>
          <div class="field">
            <label for="currency">Moneda</label>
            <select id="currency" v-model="form.currencyCode">
              <option v-for="c in CURRENCY_OPTIONS" :key="c" :value="c">{{ c }}</option>
              <option value="otra">Otra…</option>
            </select>
            <input v-if="form.currencyCode === 'otra'" v-model="form.currencyCustom" type="text" maxlength="3" placeholder="Código ISO de 3 letras" class="field__sub-input">
          </div>
          <div class="field">
            <label>Rango del filtro de precio del catálogo</label>
            <div class="field-row">
              <input v-model="form.catalogMinPrice" type="number" min="0" step="0.01" placeholder="Mínimo" required>
              <input v-model="form.catalogMaxPrice" type="number" min="0" step="0.01" placeholder="Máximo" required>
            </div>
            <p v-if="!catalogPriceValid" class="field__err">El mínimo debe ser menor al máximo.</p>
            <p class="field__hint">Son los extremos del control deslizante de precio en el catálogo, no un límite de cuánto puede costar un producto.</p>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'reglas'">
            {{ savingSection === 'reglas' ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </div>

      <!-- Lineas de negocio -->
      <div v-show="activeTab === 'lineas'" class="tab-panel">
        <form class="panel settings-card" @submit.prevent="saveLineas">
          <h2>Líneas de negocio activas</h2>
          <p class="settings-card__desc">
            Desactivar una línea solo la oculta del catálogo y del inicio — no borra productos
            ni afecta pedidos ya existentes. El panel de administración sigue mostrando todo.
          </p>
          <label class="field field--checkbox">
            <input v-model="form.physicalEnabled" type="checkbox">
            Productos físicos
          </label>
          <label class="field field--checkbox">
            <input v-model="form.digitalEnabled" type="checkbox">
            Licencias digitales
          </label>
          <label class="field field--checkbox">
            <input v-model="form.serviceEnabled" type="checkbox">
            Servicios técnicos
          </label>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'lineas'">
            {{ savingSection === 'lineas' ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </div>

      <!-- Contacto y redes -->
      <div v-show="activeTab === 'contacto'" class="tab-panel">
        <form class="panel settings-card" @submit.prevent="saveContacto">
          <h2>Contacto y redes sociales</h2>
          <p class="settings-card__desc">El número de avisos es distinto del botón flotante: este es para que TÚ te enteres de una venta, no para que te escriban los clientes.</p>
          <div class="field">
            <label for="owner-wa">Números de WhatsApp para avisos de venta</label>
            <input id="owner-wa" v-model="form.ownerWhatsappNumbers" type="text" placeholder="51999888777, 51988777666">
            <p class="field__hint">Separados por coma. Formato internacional.</p>
          </div>
          <div class="field">
            <label for="sender-email">Correo remitente</label>
            <input id="sender-email" v-model="form.senderEmail" type="text" placeholder="Mi Tienda &lt;ventas@mitienda.com&gt;">
          </div>
          <div class="field">
            <label for="fb-url">Facebook (opcional)</label>
            <input id="fb-url" v-model="form.facebookUrl" type="text" placeholder="https://facebook.com/…">
          </div>
          <div class="field">
            <label for="ig-url">Instagram (opcional)</label>
            <input id="ig-url" v-model="form.instagramUrl" type="text" placeholder="https://instagram.com/…">
          </div>
          <div class="field">
            <label for="tt-url">TikTok (opcional)</label>
            <input id="tt-url" v-model="form.tiktokUrl" type="text" placeholder="https://tiktok.com/@…">
          </div>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'contacto'">
            {{ savingSection === 'contacto' ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </div>

      <!-- Inicio -->
      <div v-show="activeTab === 'inicio'" class="tab-panel">
        <form class="panel settings-card" @submit.prevent="saveInicio">
          <h2>Página de inicio</h2>
          <p class="settings-card__desc">El resto del contenido del inicio (beneficios, tipos de producto) no es editable desde aquí todavía.</p>
          <div class="field">
            <label for="hero-badge">Badge superior</label>
            <input id="hero-badge" v-model="form.homeHeroBadge" type="text" maxlength="120" placeholder="⚡ Ahora con pagos vía Mercado Pago">
          </div>
          <div class="field">
            <label for="hero-title">Título principal</label>
            <input id="hero-title" v-model="form.homeHeroTitle" type="text" maxlength="200" placeholder="Todo lo que tu proyecto necesita.">
          </div>
          <div class="field">
            <label for="hero-subtitle">Subtítulo</label>
            <textarea id="hero-subtitle" v-model="form.homeHeroSubtitle" rows="2" maxlength="400" />
          </div>
          <div class="field">
            <label>Textos destacados (máx. 4)</label>
            <div v-for="(badge, i) in trustBadges" :key="i" class="repeat-row">
              <select v-model="badge.icon" class="repeat-row__select">
                <option value="shield">Escudo</option>
                <option value="bolt">Rayo</option>
                <option value="headset">Soporte</option>
              </select>
              <input v-model="badge.text" type="text" maxlength="60" placeholder="Pago seguro" class="repeat-row__input">
              <button type="button" class="repeat-row__remove" aria-label="Quitar" @click="removeTrustBadge(i)">✕</button>
            </div>
            <button v-if="trustBadges.length < 4" type="button" class="btn btn-outline btn-small" @click="addTrustBadge">+ Agregar</button>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'inicio'">
            {{ savingSection === 'inicio' ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </div>

      <!-- Textos legales -->
      <div v-show="activeTab === 'legal'" class="tab-panel">
        <form class="panel settings-card" @submit.prevent="saveLegal('terms')">
          <h2>Términos y condiciones</h2>
          <p class="settings-card__desc">Si no agregas secciones aquí, se muestra el texto genérico por defecto.</p>
          <div v-for="(section, i) in legalTerms" :key="i" class="legal-section">
            <input v-model="section.title" type="text" placeholder="Título de la sección" class="legal-section__title">
            <textarea v-model="section.body" rows="3" placeholder="Contenido de la sección" />
            <button type="button" class="repeat-row__remove" aria-label="Quitar sección" @click="removeSection(legalTerms, i)">✕ Quitar sección</button>
          </div>
          <button type="button" class="btn btn-outline btn-small" @click="addSection(legalTerms)">+ Agregar sección</button>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'legal-terms'">
            {{ savingSection === 'legal-terms' ? 'Guardando…' : 'Guardar términos' }}
          </button>
        </form>

        <form class="panel settings-card" @submit.prevent="saveLegal('privacy')">
          <h2>Política de privacidad</h2>
          <div v-for="(section, i) in legalPrivacy" :key="i" class="legal-section">
            <input v-model="section.title" type="text" placeholder="Título de la sección" class="legal-section__title">
            <textarea v-model="section.body" rows="3" placeholder="Contenido de la sección" />
            <button type="button" class="repeat-row__remove" aria-label="Quitar sección" @click="removeSection(legalPrivacy, i)">✕ Quitar sección</button>
          </div>
          <button type="button" class="btn btn-outline btn-small" @click="addSection(legalPrivacy)">+ Agregar sección</button>
          <button type="submit" class="btn btn-primary" :disabled="savingSection === 'legal-privacy'">
            {{ savingSection === 'legal-privacy' ? 'Guardando…' : 'Guardar privacidad' }}
          </button>
        </form>
      </div>

      <!-- Plantillas de correo -->
      <div v-show="activeTab === 'plantillas'" class="tab-panel">
        <p class="settings-card__desc tab-panel__intro">
          Solo estos dos correos son editables: son los únicos con texto 100% fijo (sin lógica
          condicional). El aviso interno de ventas y los mensajes de WhatsApp no lo son — WhatsApp
          exige plantillas pre-aprobadas por Meta, su contenido no puede ser libre.
        </p>
        <form v-for="(info, key) in TEMPLATE_INFO" :key="key" class="panel settings-card" @submit.prevent="saveTemplate(key)">
          <h2>{{ info.label }}</h2>
          <p class="settings-card__desc">Variables disponibles: <code v-for="v in info.vars" :key="v">{{ varToken(v) }} </code></p>
          <div class="field">
            <label :for="`${key}-subject`">Asunto</label>
            <input :id="`${key}-subject`" v-model="templateForms[key].subject" type="text" maxlength="200" :placeholder="info.defaultSubject">
          </div>
          <div class="field">
            <label :for="`${key}-body`">Cuerpo (HTML)</label>
            <textarea :id="`${key}-body`" v-model="templateForms[key].body" rows="6" placeholder="<p>…</p>" />
          </div>
          <div class="tab-panel__actions">
            <button type="submit" class="btn btn-primary" :disabled="savingTemplate === key">
              {{ savingTemplate === key ? 'Guardando…' : 'Guardar plantilla' }}
            </button>
            <button type="button" class="btn btn-outline" :disabled="savingTemplate === key" @click="resetTemplate(key)">
              Restablecer por defecto
            </button>
          </div>
        </form>
      </div>

      <p v-if="lastUpdated" class="settings-page__meta">
        Última actualización: {{ formatDate(lastUpdated) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.25rem;
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
.page-header__desc {
  color: var(--color-ink-muted);
  font-size: 0.9rem;
  margin: 0.3rem 0 0;
}
.settings-page__loading {
  color: var(--color-ink-muted);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-border-strong);
  padding-bottom: 0.75rem;
}
.tabs__btn {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  cursor: pointer;
}
.tabs__btn.is-active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #16110d;
}

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 680px;
}
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.tab-panel__intro {
  margin: 0;
}
.tab-panel__actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
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
.settings-card__desc code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  background: var(--color-bg);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
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
.field input,
.field select,
.field textarea {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.9rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
}
.field textarea {
  resize: vertical;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}
.field__sub-input {
  margin-top: 0.5rem;
}
.field-row {
  display: flex;
  gap: 0.6rem;
}
.field-row input {
  flex: 1;
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
.field--checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-ink);
}
.field--checkbox input {
  width: auto;
}

.btn-small {
  font-size: 0.8rem;
  padding: 0.4rem 0.9rem;
}

.repeat-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.repeat-row__select {
  flex: 0 0 110px;
}
.repeat-row__input {
  flex: 1;
}
.repeat-row__remove {
  flex: 0 0 auto;
  border: none;
  background: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.3rem 0.5rem;
}

.legal-section {
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  padding: 0.85rem;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.legal-section__title {
  font-weight: 600;
}

.settings-page__meta {
  font-size: 0.78rem;
  color: var(--color-ink-faint);
  margin: 0;
}
</style>
