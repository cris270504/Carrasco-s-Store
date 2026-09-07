<script setup lang="ts">
const { fetchCart } = useCart()
const { fetchFavorites } = useFavorites()
onMounted(() => {
  fetchCart()
  fetchFavorites()
})

useHead({
  titleTemplate: (title) => title ? `${title} · Carrasco Store` : 'Carrasco Store',
})
</script>

<template>
  <NuxtLoadingIndicator color="var(--color-accent)" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- ConfirmDialog/ToastStack no tienen nada que mostrar en el primer render
       (su estado siempre nace vacio) y viven en un Teleport a <body>: sin
       ClientOnly, Vue intenta hidratar ese Teleport contra el SSR y tira
       "Hydration node mismatch" en cada carga, aunque termine sin romper nada. -->
  <ClientOnly>
    <ConfirmDialog />
    <ToastStack />
  </ClientOnly>
</template>