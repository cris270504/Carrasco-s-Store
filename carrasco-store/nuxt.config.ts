// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxt/image'],
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
  runtimeConfig: {
    public: {
      adminEmails: process.env.ADMIN_EMAILS || '',
    },
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
    },
  },
})