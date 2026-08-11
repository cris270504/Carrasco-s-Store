<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const productId = route.params.id as string
</script>

<template>
  <div class="edit-product-page">
    <header class="page-header">
      <div>
        <p class="page-header__eyebrow">Catálogo</p>
        <h1>Editar producto</h1>
      </div>
    </header>

    <AdminProductForm :product-id="productId" />
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1.5rem;
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
</style>
