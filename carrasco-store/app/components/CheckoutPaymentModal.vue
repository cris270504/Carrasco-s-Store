<script setup lang="ts">
import type { BrickFormData, BrickPayer } from '~/composables/useMercadoPago'

export interface PaymentSession {
  orderId: string
  publicKey: string
  amount: string
  description: string
  preferenceId: string | null
  payer: BrickPayer
}

const props = defineProps<{ open: boolean, session: PaymentSession | null }>()
const emit = defineEmits<{ close: [], paid: [orderId: string] }>()

const CONTAINER_ID = 'mp-payment-brick'

type Phase = 'form' | 'processing' | 'success' | 'failed' | 'pending'
const phase = ref<Phase>('form')
const brickReady = ref(false)
const message = ref('')

const dialogRef = ref<HTMLElement | null>(null)
useFocusTrap(dialogRef, toRef(props, 'open'))

const { mountPaymentBrick, unmount } = useMercadoPago()

const reduceMotion = import.meta.client
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function reset() {
  phase.value = 'form'
  brickReady.value = false
  message.value = ''
}

function requestClose() {
  // Durante el cobro no se puede cerrar: el pago ya esta en curso.
  if (phase.value === 'processing') return
  emit('close')
}

async function mount() {
  if (!props.session) return
  reset()
  try {
    await mountPaymentBrick({
      publicKey: props.session.publicKey,
      containerId: CONTAINER_ID,
      amount: Number(props.session.amount),
      preferenceId: props.session.preferenceId,
      payer: props.session.payer,
      onReady: () => { brickReady.value = true },
      onError: () => {
        // Errores de validacion del formulario los muestra el propio Brick;
        // aca solo se asegura que el contenedor quede visible.
        brickReady.value = true
      },
      onSubmit: handleSubmit,
    })
  }
  catch (err) {
    message.value = err instanceof Error ? err.message : 'No se pudo iniciar el pago.'
    phase.value = 'failed'
  }
}

async function handleSubmit(formData: BrickFormData, paymentTypeId: string | undefined) {
  if (!props.session) return
  phase.value = 'processing'
  message.value = ''
  try {
    const res = await $fetch<{ status: string, orderId: string, detail?: string | null }>(
      '/api/checkout/confirm',
      { method: 'POST', body: { orderId: props.session.orderId, formData, paymentTypeId } },
    )

    if (res.status === 'processed') {
      phase.value = 'success'
      const delay = reduceMotion ? 400 : 1800
      window.setTimeout(() => emit('paid', res.orderId), delay)
      return
    }

    if (res.status === 'failed') {
      message.value = 'El pago fue rechazado. Prueba con otra tarjeta o medio de pago.'
      phase.value = 'failed'
      return
    }

    // processing | action_required | in_review | created | ...
    phase.value = 'pending'
  }
  catch (err) {
    message.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'No se pudo procesar el pago. Intenta nuevamente.'
    phase.value = 'failed'
  }
}

function retry() {
  // El Brick sigue montado (v-show): al volver a "form" el usuario reenvia y
  // se genera un token nuevo.
  reset()
}

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.session) {
    await nextTick()
    await mount()
  }
  else {
    unmount()
    reset()
  }
})

onBeforeUnmount(unmount)
</script>

<template>
  <Teleport to="body">
    <Transition name="pay-fade">
      <div v-if="open" class="pay-overlay" @click.self="requestClose">
        <div
          ref="dialogRef"
          class="pay-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-title"
        >
          <button
            v-if="phase !== 'processing'"
            type="button"
            class="pay-dialog__x"
            aria-label="Cerrar"
            @click="requestClose"
          >
            ✕
          </button>

          <h3 id="pay-title" class="pay-dialog__title">
            {{
              phase === 'success' ? '¡Pago confirmado!'
              : phase === 'failed' ? 'El pago no se pudo completar'
              : phase === 'pending' ? 'Pago en revisión'
              : 'Completa tu pago'
            }}
          </h3>

          <!-- Formulario / Brick -->
          <div v-show="phase === 'form'" class="pay-body">
            <p class="pay-amount">Total a pagar: <strong>S/ {{ session?.amount }}</strong></p>

            <div class="pay-note">
              <span class="pay-note__icon" aria-hidden="true">ℹ️</span>
              <span>
                Con tarjeta de crédito o débito pagas sin salir de esta página. Si eliges
                <strong>Mercado Pago / Yape</strong>, te llevaremos a Mercado Pago para terminar
                el pago y luego volverás aquí.
              </span>
            </div>

            <div v-if="!brickReady" class="pay-loading">Cargando medios de pago…</div>
            <div :id="CONTAINER_ID" />
          </div>

          <!-- Procesando -->
          <div v-if="phase === 'processing'" class="pay-body pay-body--center">
            <div class="pay-spinner" aria-hidden="true" />
            <p>Procesando tu pago…</p>
          </div>

          <!-- Exito -->
          <div v-if="phase === 'success'" class="pay-body pay-body--center">
            <svg class="pay-check" :class="{ 'is-static': reduceMotion }" viewBox="0 0 52 52" aria-hidden="true">
              <circle class="pay-check__circle" cx="26" cy="26" r="24" fill="none" />
              <path class="pay-check__mark" fill="none" d="M14 27l8 8 16-16" />
            </svg>
            <p>Tu pedido quedó registrado. Te llevamos a tu panel…</p>
          </div>

          <!-- Rechazado / error -->
          <div v-if="phase === 'failed'" class="pay-body pay-body--center">
            <span class="pay-result-icon is-failed" aria-hidden="true">✕</span>
            <p>{{ message }}</p>
            <p class="pay-body__hint">No se te realizó ningún cargo.</p>
            <div class="pay-actions">
              <button type="button" class="btn btn-primary" @click="retry">Reintentar</button>
              <button type="button" class="btn btn-outline" @click="requestClose">Cerrar</button>
            </div>
          </div>

          <!-- En revisión -->
          <div v-if="phase === 'pending'" class="pay-body pay-body--center">
            <span class="pay-result-icon is-pending" aria-hidden="true">⏳</span>
            <p>Mercado Pago está revisando el pago. Te avisaremos por correo y verás el estado en tu panel apenas se acredite. Tu carrito se conserva por si necesitas reintentar.</p>
            <div class="pay-actions">
              <NuxtLink to="/dashboard" class="btn btn-primary">Ir a mi panel</NuxtLink>
              <button type="button" class="btn btn-outline" @click="requestClose">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pay-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 2.5rem 1rem;
  background: rgba(22, 17, 13, 0.55);
}
.pay-dialog {
  position: relative;
  width: 100%;
  max-width: 460px;
  background: var(--color-surface);
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-hover);
  padding: 1.75rem 1.5rem;
}
.pay-dialog__x {
  position: absolute;
  top: 0.75rem;
  right: 0.9rem;
  border: none;
  background: none;
  font-size: 1rem;
  line-height: 1;
  color: var(--color-ink-faint);
  cursor: pointer;
}
.pay-dialog__x:hover {
  color: var(--color-ink);
}
.pay-dialog__title {
  font-size: 1.2rem;
  margin: 0 0 1rem;
  padding-right: 1.5rem;
}

.pay-body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.pay-body--center {
  align-items: center;
  text-align: center;
  padding: 1rem 0 0.25rem;
}
.pay-body__hint {
  font-size: 0.82rem;
  color: var(--color-ink-muted);
  margin: -0.4rem 0 0;
}

.pay-amount {
  font-size: 0.92rem;
  color: var(--color-ink-muted);
  margin: 0;
}
.pay-amount strong {
  color: var(--color-ink);
}

.pay-note {
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-ink-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: 0.7rem 0.85rem;
}
.pay-note__icon {
  flex-shrink: 0;
}
.pay-note strong {
  color: var(--color-ink);
}

.pay-loading {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  padding: 0.5rem 0;
}

.pay-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.pay-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  animation: pay-spin 0.7s linear infinite;
}
@keyframes pay-spin {
  to { transform: rotate(360deg); }
}

.pay-result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  font-size: 1.3rem;
  font-weight: 700;
}
.pay-result-icon.is-failed {
  background: var(--color-danger-tint);
  color: var(--color-danger);
}
.pay-result-icon.is-pending {
  background: var(--color-service-tint);
}

/* Checkmark dibujandose */
.pay-check {
  width: 64px;
  height: 64px;
}
.pay-check__circle {
  stroke: var(--color-success);
  stroke-width: 3;
  stroke-dasharray: 151;
  stroke-dashoffset: 151;
  animation: pay-draw 0.5s ease-out forwards;
}
.pay-check__mark {
  stroke: var(--color-success);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: pay-draw 0.35s 0.45s ease-out forwards;
}
@keyframes pay-draw {
  to { stroke-dashoffset: 0; }
}
.pay-check.is-static .pay-check__circle,
.pay-check.is-static .pay-check__mark {
  animation: none;
  stroke-dashoffset: 0;
}

.pay-fade-enter-active,
.pay-fade-leave-active {
  transition: opacity 0.15s ease;
}
.pay-fade-enter-from,
.pay-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .pay-spinner,
  .pay-check__circle,
  .pay-check__mark {
    animation: none;
  }
  .pay-check__circle,
  .pay-check__mark {
    stroke-dashoffset: 0;
  }
}
</style>
