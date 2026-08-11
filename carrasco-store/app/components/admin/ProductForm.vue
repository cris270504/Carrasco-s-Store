<script setup lang="ts">
import { PRODUCT_TYPES, type ProductType } from '../../../shared/utils/productTypes'
import type { AdminCategory, AdminProductDetail, AdminProductVariant } from '../../types/admin'

const props = defineProps<{ productId?: string }>()
const isEdit = computed(() => !!props.productId)

const toast = useToast()

const { data: categories } = await useFetch<AdminCategory[]>('/api/admin/categories', { default: () => [] })

const { data: existingProduct, pending: loadingProduct } = await useFetch<AdminProductDetail>(
  () => `/api/admin/products/${props.productId}`,
  { immediate: isEdit.value, default: () => null },
)

const typeLabels: Record<ProductType, string> = { physical: 'Físico', digital: 'Digital', service: 'Servicio' }

const form = reactive({
  name: '',
  description: '',
  brand: '',
  categoryId: '',
  price: '',
  type: 'physical' as ProductType,
  isActive: true,
  requiresShipping: true,
  stock: 0,
  durationMinutes: 60,
  defaultModality: 'remote' as 'remote' | 'in_person',
})

const images = ref<string[]>([])
const uploadingImage = ref(false)
const variants = ref<AdminProductVariant[]>([])
const removedVariantIds = ref<string[]>([])
const newLicenseCodes = ref('')
const licenseCounts = ref({ available: 0, reserved: 0, delivered: 0 })

watch(existingProduct, (product) => {
  if (!product) return

  form.name = product.name
  form.description = product.description ?? ''
  form.brand = product.brand ?? ''
  form.categoryId = product.categoryId ?? ''
  form.price = product.price
  form.type = product.type
  form.isActive = product.isActive ?? true
  form.requiresShipping = product.requiresShipping ?? true
  form.stock = product.stock ?? 0
  form.durationMinutes = product.serviceDetail?.durationMinutes ?? 60
  form.defaultModality = product.serviceDetail?.defaultModality ?? 'remote'

  images.value = [...product.images]
  variants.value = product.variants.map(v => ({ ...v }))
  licenseCounts.value = {
    available: product.licenses.filter(l => l.status === 'available').length,
    reserved: product.licenses.filter(l => l.status === 'reserved').length,
    delivered: product.licenses.filter(l => l.status === 'delivered').length,
  }
}, { immediate: true })

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    toast.error('Formato no permitido. Usa PNG, JPG, WEBP o GIF.')
    return
  }
  if (file.size > MAX_IMAGE_SIZE) {
    toast.error('La imagen supera el tamaño máximo de 5MB.')
    return
  }

  uploadingImage.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: formData })
    images.value.push(result.url)
  }
  catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.error(fetchError?.data?.statusMessage || 'No se pudo subir la imagen. Intenta de nuevo.')
  }
  finally {
    uploadingImage.value = false
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function addVariant() {
  variants.value.push({ name: '', value: '', priceModifier: '0', stock: 0, sku: null })
}

function removeVariant(index: number) {
  const [removed] = variants.value.splice(index, 1)
  if (removed?.id) removedVariantIds.value.push(removed.id)
}

const submitting = ref(false)

async function handleSubmit() {
  if (!form.name.trim()) {
    toast.error('El nombre es requerido')
    return
  }
  if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0) {
    toast.error('El precio debe ser un número mayor a 0')
    return
  }

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      categoryId: form.categoryId || null,
      price: form.price,
      images: images.value,
      isActive: form.isActive,
    }

    if (!isEdit.value) {
      payload.type = form.type
    }

    if (form.type === 'physical') {
      payload.requiresShipping = form.requiresShipping
      payload.stock = form.stock
      payload.variants = variants.value.map(v => ({
        id: v.id,
        name: v.name,
        value: v.value,
        priceModifier: v.priceModifier,
        stock: v.stock,
        sku: v.sku,
      }))
      if (isEdit.value) payload.removedVariantIds = removedVariantIds.value
    }

    if (form.type === 'service') {
      payload.durationMinutes = form.durationMinutes
      payload.defaultModality = form.defaultModality
    }

    if (form.type === 'digital') {
      const codes = newLicenseCodes.value.split('\n').map(s => s.trim()).filter(Boolean)
      if (isEdit.value) payload.newLicenseCodes = codes
      else payload.licenseCodes = codes
    }

    if (isEdit.value) {
      await $fetch(`/api/admin/products/${props.productId}`, { method: 'PATCH', body: payload })
    }
    else {
      await $fetch('/api/admin/products', { method: 'POST', body: payload })
    }

    toast.success(isEdit.value ? 'Producto actualizado.' : 'Producto creado.')
    await navigateTo('/admin/productos')
  }
  catch (err) {
    const fetchError = err as { data?: { statusMessage?: string } }
    toast.error(fetchError?.data?.statusMessage || 'Ocurrió un error al guardar el producto')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="product-form" @submit.prevent="handleSubmit">
    <p v-if="loadingProduct" class="product-form__loading">Cargando producto…</p>

    <template v-else>
      <div class="panel product-form__section">
        <h2>Datos generales</h2>

        <div class="field">
          <label for="pf-name">Nombre</label>
          <input id="pf-name" v-model="form.name" type="text" required>
        </div>

        <div class="field">
          <label for="pf-description">Descripción</label>
          <textarea id="pf-description" v-model="form.description" rows="3" />
        </div>

        <div class="field-row">
          <div class="field">
            <label for="pf-brand">Marca</label>
            <input id="pf-brand" v-model="form.brand" type="text">
          </div>
          <div class="field">
            <label for="pf-category">Categoría</label>
            <select id="pf-category" v-model="form.categoryId">
              <option value="">Sin categoría</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="pf-price">Precio (S/)</label>
            <input id="pf-price" v-model="form.price" type="number" step="0.01" min="0.01" required>
          </div>
          <div class="field">
            <label for="pf-type">Tipo</label>
            <select id="pf-type" v-model="form.type" :disabled="isEdit">
              <option v-for="t in PRODUCT_TYPES" :key="t" :value="t">{{ typeLabels[t] }}</option>
            </select>
            <p v-if="isEdit" class="field__hint">El tipo no se puede cambiar después de crear el producto.</p>
          </div>
        </div>

        <div class="field">
          <label>Imágenes</label>
          <div class="product-form__images">
            <div v-for="(url, index) in images" :key="url" class="product-form__image-item">
              <img :src="url" alt="">
              <button type="button" class="product-form__image-remove" aria-label="Quitar imagen" @click="removeImage(index)">
                ×
              </button>
            </div>
            <label class="product-form__image-upload" :class="{ 'is-uploading': uploadingImage }">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                class="product-form__file-input"
                :disabled="uploadingImage"
                @change="handleImageUpload"
              >
              <span v-if="uploadingImage">Subiendo…</span>
              <span v-else>+ Agregar imagen</span>
            </label>
          </div>
          <p class="field__hint">PNG, JPG, WEBP o GIF · máx. 5MB por imagen.</p>
        </div>

        <label class="checkbox">
          <input v-model="form.isActive" type="checkbox">
          Producto activo (visible en el catálogo)
        </label>
      </div>

      <div v-if="form.type === 'physical'" class="panel product-form__section">
        <h2>Inventario físico</h2>

        <label class="checkbox">
          <input v-model="form.requiresShipping" type="checkbox">
          Requiere envío
        </label>

        <div v-if="variants.length === 0" class="field">
          <label for="pf-stock">Stock</label>
          <input id="pf-stock" v-model.number="form.stock" type="number" min="0" step="1">
        </div>

        <div class="product-form__variants">
          <div class="product-form__variants-header">
            <h3>Variantes</h3>
            <button type="button" class="btn btn-outline btn-sm" @click="addVariant">+ Agregar variante</button>
          </div>
          <p v-if="variants.length > 0" class="field__hint">
            Con variantes, el stock se gestiona por cada una (el campo de stock general queda deshabilitado).
          </p>

          <div v-if="variants.length > 0" class="product-form__variant-table">
            <div class="product-form__variant-row product-form__variant-row--head">
              <span>Nombre</span>
              <span>Valor</span>
              <span>+ Precio</span>
              <span>Stock</span>
              <span>SKU</span>
              <span />
            </div>
            <div v-for="(variant, index) in variants" :key="variant.id ?? index" class="product-form__variant-row">
              <input v-model="variant.name" type="text" placeholder="Capacidad">
              <input v-model="variant.value" type="text" placeholder="1TB">
              <input v-model="variant.priceModifier" type="number" step="0.01" placeholder="0.00">
              <input v-model.number="variant.stock" type="number" min="0" step="1" placeholder="0">
              <input v-model="variant.sku" type="text" placeholder="SKU">
              <button type="button" class="icon-btn is-danger" aria-label="Quitar variante" @click="removeVariant(index)">
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="form.type === 'digital'" class="panel product-form__section">
        <h2>Licencias digitales</h2>

        <p v-if="isEdit" class="field__hint">
          Disponibles: {{ licenseCounts.available }} · Reservadas: {{ licenseCounts.reserved }} · Entregadas: {{ licenseCounts.delivered }}
        </p>

        <div class="field">
          <label for="pf-licenses">
            {{ isEdit ? 'Agregar más códigos (uno por línea)' : 'Códigos de licencia (uno por línea, opcional)' }}
          </label>
          <textarea id="pf-licenses" v-model="newLicenseCodes" rows="4" placeholder="CODIGO-1234-ABCD" />
          <p class="field__hint">Los códigos se cifran antes de guardarse; los ya entregados no se pueden editar aquí.</p>
        </div>
      </div>

      <div v-else-if="form.type === 'service'" class="panel product-form__section">
        <h2>Detalle del servicio</h2>

        <div class="field-row">
          <div class="field">
            <label for="pf-duration">Duración (minutos)</label>
            <input id="pf-duration" v-model.number="form.durationMinutes" type="number" min="1" step="1">
          </div>
          <div class="field">
            <label for="pf-modality">Modalidad por defecto</label>
            <select id="pf-modality" v-model="form.defaultModality">
              <option value="remote">Remoto</option>
              <option value="in_person">Presencial</option>
            </select>
          </div>
        </div>
      </div>

      <div class="product-form__actions">
        <NuxtLink to="/admin/productos" class="btn btn-ghost">Cancelar</NuxtLink>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto' }}
        </button>
      </div>
    </template>
  </form>
</template>

<style scoped>
.product-form {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.product-form__loading {
  color: var(--color-ink-muted);
}
.product-form__section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.product-form__section h2 {
  font-size: 1rem;
}
.product-form__section h3 {
  font-size: 0.88rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-ink-muted);
}
.field__hint {
  font-size: 0.78rem;
  color: var(--color-ink-faint);
  margin: 0;
}

.field input,
.field select,
.field textarea {
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

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: var(--color-ink);
}

.product-form__images {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.product-form__image-item {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: var(--radius-control);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.product-form__image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.product-form__image-remove {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(15, 17, 19, 0.65);
  color: #fff;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
}
.product-form__image-upload {
  position: relative;
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.3rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-control);
  font-size: 0.72rem;
  color: var(--color-ink-muted);
  cursor: pointer;
}
.product-form__image-upload:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.product-form__image-upload.is-uploading {
  cursor: wait;
  opacity: 0.7;
}
.product-form__file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.product-form__variants {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.product-form__variants-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.product-form__variant-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.product-form__variant-row {
  display: grid;
  grid-template-columns: 1.3fr 1.3fr 0.9fr 0.8fr 1.1fr 28px;
  gap: 0.5rem;
  align-items: center;
}
.product-form__variant-row--head span {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-ink-faint);
}
.product-form__variant-row input {
  width: 100%;
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
}

.btn-sm {
  padding: 0.4rem 0.7rem;
  font-size: 0.8rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.icon-btn.is-danger:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 1.1rem;
}

.product-form__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }
  .product-form__variant-row,
  .product-form__variant-row--head {
    grid-template-columns: 1fr 1fr;
  }
  .product-form__variant-row--head {
    display: none;
  }
}
</style>
