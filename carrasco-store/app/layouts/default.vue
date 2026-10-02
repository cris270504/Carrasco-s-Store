<script setup lang="ts">
// Lectura no bloqueante: igual que WhatsappFloat/OfferCountdown, el SSR
// inicial muestra el nombre por defecto y se actualiza solo al cargar
// store_settings (ver /admin/configuracion).
const { settings, ensureSettings } = useStoreSettings()
onMounted(() => { ensureSettings() })

useSeoMeta({
  ogTitle: () => settings.value?.storeName || 'Carrasco Store',
  ogDescription: 'Productos físicos, licencias digitales y servicios técnicos en un solo carrito, con pago seguro vía Mercado Pago.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-shell__main">
      <slot />
    </main>
    <AppFooter />
    <ClientOnly>
      <WelcomeModal />
      <WhatsappFloat />
    </ClientOnly>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-shell__main {
  flex: 1;
}
</style>
