<script setup lang="ts">
useSeoMeta({
  ogTitle: 'Carrasco Store',
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
