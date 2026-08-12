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
  <ConfirmDialog />
  <ToastStack />
</template>