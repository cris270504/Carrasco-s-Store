<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <div class="app-footer__brand">
        <NuxtLink to="/" class="app-footer__logo">Carrasco Store</NuxtLink>
        <p>Productos físicos, licencias digitales y servicios técnicos en un solo carrito.</p>
      </div>

      <nav class="app-footer__col" aria-label="Tienda">
        <p class="app-footer__heading">Tienda</p>
        <NuxtLink to="/catalogo">Todo el catálogo</NuxtLink>
        <NuxtLink to="/catalogo?type=physical">Productos físicos</NuxtLink>
        <NuxtLink to="/catalogo?type=digital">Licencias digitales</NuxtLink>
        <NuxtLink to="/catalogo?type=service">Servicios técnicos</NuxtLink>
      </nav>

      <nav class="app-footer__col" aria-label="Cuenta">
        <p class="app-footer__heading">Cuenta</p>
        <NuxtLink to="/login">Iniciar sesión</NuxtLink>
        <NuxtLink to="/register">Crear cuenta</NuxtLink>
        <NuxtLink to="/dashboard">Mi panel</NuxtLink>
        <NuxtLink to="/cart">Mi carrito</NuxtLink>
      </nav>
    </div>

    <div class="app-footer__bottom">
      <span>© {{ year }} Carrasco Store</span>
      <span>Pagos procesados con Mercado Pago</span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 3rem;
  background: #171a1c;
  color: rgba(255, 255, 255, 0.78);
}
.app-footer__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2.75rem 1.5rem 2rem;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 2rem;
}
.app-footer__brand p {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
  max-width: 320px;
  color: rgba(255, 255, 255, 0.6);
}
.app-footer__logo {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
  color: #fff;
  text-decoration: none;
}
.app-footer__col {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.app-footer__heading {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.45);
  margin: 0 0 0.2rem;
}
.app-footer__col a {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
}
.app-footer__col a:hover {
  color: #fff;
}
.app-footer__bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1rem 1.5rem;
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
}

@media (max-width: 640px) {
  .app-footer__inner {
    grid-template-columns: 1fr;
  }
}
</style>
