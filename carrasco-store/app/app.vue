<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-shell__main">
      <NuxtPage />
    </main>
    <AppFooter />
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