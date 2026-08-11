<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
</script>

<template>
  <div class="new-product-page">
    <header class="page-header">
      <div>
        <p class="page-header__eyebrow">Catálogo</p>
        <h1>Nuevo producto</h1>
      </div>
    </header>

    <AdminProductForm />
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
