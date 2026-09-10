<script setup lang="ts">
// Boton flotante para escribir a la tienda por WhatsApp. El numero y el
// mensaje se configuran en /admin/configuracion (store_settings). Si no hay
// numero cargado, el boton no se muestra.
const { settings, ensureSettings } = useStoreSettings()
onMounted(() => { ensureSettings() })

const href = computed(() => {
  const number = settings.value?.whatsappNumber?.replace(/[^\d]/g, '')
  if (!number) return null
  const text = settings.value?.whatsappCta?.trim() || 'Hola, quiero más información sobre un producto.'
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
})
</script>

<template>
  <a
    v-if="href"
    :href="href"
    class="wa-float"
    target="_blank"
    rel="noopener"
    aria-label="Escríbenos por WhatsApp"
  >
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.1.55 4.06 1.6 5.82L2 22l4.4-1.15a9.86 9.86 0 0 0 5.64 1.72h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.07c-.25.7-1.44 1.33-1.99 1.37-.53.04-1.03.22-3.47-.72-2.94-1.16-4.8-4.16-4.94-4.35-.14-.19-1.19-1.58-1.19-3.02 0-1.44.75-2.15 1.02-2.44.27-.29.59-.36.79-.36l.57.01c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.32.02.51-.1.19-.15.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.12.58.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.15.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.39-.24.65-.14.27.1 1.71.81 2 .96.29.14.49.22.56.34.07.12.07.7-.18 1.4Z" />
    </svg>
    <span class="wa-float__label">WhatsApp</span>
  </a>
</template>

<style scoped>
.wa-float {
  position: fixed;
  right: 1.1rem;
  bottom: 1.1rem;
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem;
  border-radius: 999px;
  background: #25d366;
  color: #fff;
  text-decoration: none;
  border: 2px solid #0b3d1e;
  box-shadow: 4px 4px 0 0 #0b3d1e;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.wa-float:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 0 #0b3d1e;
}
.wa-float__label {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.88rem;
  padding-right: 0.35rem;
}

@media (max-width: 560px) {
  .wa-float {
    right: 0.9rem;
    bottom: 0.9rem;
  }
  .wa-float__label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wa-float {
    transition: none;
  }
}
</style>
