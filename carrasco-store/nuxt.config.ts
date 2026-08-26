// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxt/image', '@nuxtjs/sitemap', '@nuxtjs/robots'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      meta: [
        {
          name: 'description',
          content: 'Productos físicos, licencias digitales y servicios técnicos en un solo carrito, con pago seguro vía Mercado Pago.',
        },
      ],
      script: [
        {
          // Aplica el tema antes del primer paint para evitar parpadeo (FOUC).
          innerHTML: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  supabase: {
    redirect: false
  },
  image: {
    format: ['webp'],
  },
  site: {
    // TODO: reemplazar por el dominio real de produccion (o definir NUXT_PUBLIC_SITE_URL)
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://carrasco-store.example.com',
  },
  sitemap: {
    exclude: ['/admin/**', '/cart', '/checkout/**', '/dashboard', '/favoritos', '/login', '/register', '/recuperar', '/restablecer-password'],
  },
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      },
      '/admin/**': { robots: false },
      '/cart': { robots: false },
      '/checkout/**': { robots: false },
      '/dashboard': { robots: false },
      '/favoritos': { robots: false },
    },
  },
})