<script setup lang="ts">
const { fetchCart } = useCart()
const { fetchFavorites } = useFavorites()
onMounted(() => {
  fetchCart()
  fetchFavorites()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ConfirmDialog />
  <ToastStack />
</template>