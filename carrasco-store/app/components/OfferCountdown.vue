<script setup lang="ts">
// Banda con cuenta regresiva a una fecha limite de ofertas. Titulo, fecha y
// enlace se configuran en /admin/configuracion. Se oculta sola cuando la
// fecha ya pasó o si no hay ninguna configurada.
const { settings, ensureSettings } = useStoreSettings()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  ensureSettings()
  now.value = Date.now()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

const endsAt = computed(() => {
  const raw = settings.value?.offerCountdownEndsAt
  if (!raw) return null
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? null : t
})

const remaining = computed(() => {
  if (endsAt.value === null) return null
  const ms = endsAt.value - now.value
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  }
})

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const title = computed(() => settings.value?.offerCountdownTitle?.trim() || 'Ofertas por tiempo limitado')
const url = computed(() => settings.value?.offerCountdownUrl?.trim() || '/catalogo')
const isExternal = computed(() => /^https?:\/\//.test(url.value))
</script>

<template>
  <aside v-if="remaining" class="offer-countdown">
    <div class="offer-countdown__inner">
      <div class="offer-countdown__copy">
        <span class="offer-countdown__eyebrow">⚡ Ofertas de la semana</span>
        <p class="offer-countdown__title">{{ title }}</p>
      </div>

      <div class="offer-countdown__timer" role="timer" aria-live="off">
        <div v-for="unit in [
          { v: remaining.days, l: 'Días' },
          { v: remaining.hours, l: 'Hrs' },
          { v: remaining.minutes, l: 'Min' },
          { v: remaining.seconds, l: 'Seg' },
        ]" :key="unit.l" class="offer-countdown__unit">
          <span class="offer-countdown__num">{{ pad(unit.v) }}</span>
          <span class="offer-countdown__unit-label">{{ unit.l }}</span>
        </div>
      </div>

      <a v-if="isExternal" :href="url" target="_blank" rel="noopener" class="btn btn-primary offer-countdown__cta">
        Ver ofertas
      </a>
      <NuxtLink v-else :to="url" class="btn btn-primary offer-countdown__cta">Ver ofertas</NuxtLink>
    </div>
  </aside>
</template>

<style scoped>
/* Banda oscura siempre, sin importar el tema claro/oscuro del sitio
   (misma logica que el header/footer). */
.offer-countdown {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  background: #16110d;
  color: #faf1e3;
}
.offer-countdown__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
}
.offer-countdown__copy {
  min-width: 0;
}
.offer-countdown__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4dd6a6;
}
.offer-countdown__title {
  font-family: var(--font-display);
  font-weight: 400;
  text-transform: uppercase;
  font-size: 1.15rem;
  margin: 0.15rem 0 0;
  line-height: 1.1;
}
.offer-countdown__timer {
  display: flex;
  gap: 0.5rem;
}
.offer-countdown__unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  padding: 0.4rem 0.3rem;
  background: rgba(250, 241, 227, 0.08);
  border: 1px solid rgba(250, 241, 227, 0.18);
  border-radius: var(--radius-card);
}
.offer-countdown__num {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.25rem;
  line-height: 1;
}
.offer-countdown__unit-label {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(250, 241, 227, 0.65);
  margin-top: 0.2rem;
}
.offer-countdown__cta {
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .offer-countdown__inner {
    justify-content: center;
    text-align: center;
  }
  .offer-countdown__cta {
    width: 100%;
  }
}
</style>
