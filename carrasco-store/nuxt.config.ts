// https://nuxt.com/docs/api/configuration/nuxt-config
const EXAMPLE_SITE_URL = 'https://carrasco-store.example.com'
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || EXAMPLE_SITE_URL

if (process.env.NODE_ENV === 'production' && (!process.env.NUXT_PUBLIC_SITE_URL || siteUrl === EXAMPLE_SITE_URL)) {
  console.warn(
    '[nuxt.config] NUXT_PUBLIC_SITE_URL no esta definida (o sigue siendo el dominio de ejemplo). '
    + 'El sitemap y las metaetiquetas SEO usaran un dominio incorrecto en produccion.',
  )
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    licenseEncryptionKey: process.env.LICENSE_ENCRYPTION_KEY,
    mpAccessToken: process.env.MP_ACCESS_TOKEN,
    mpPublicKey: process.env.MP_PUBLIC_KEY,
    mpWebhookSecret: process.env.MP_WEBHOOK_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
    adminEmails: process.env.ADMIN_EMAILS,
    whatsappToken: process.env.WHATSAPP_TOKEN,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappOwnerNumbers: process.env.WHATSAPP_OWNER_NUMBERS,
    whatsappOwnerTemplate: process.env.WHATSAPP_OWNER_TEMPLATE,
    whatsappBuyerTemplate: process.env.WHATSAPP_BUYER_TEMPLATE,
    whatsappTemplateLang: process.env.WHATSAPP_TEMPLATE_LANG,
    public: {},
  },
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
    // Bucket publico de Supabase Storage donde vive product-images (ver
    // server/api/admin/upload.post.ts): sin esto, NuxtImg no puede
    // transformar/optimizar imagenes servidas desde ese dominio externo.
    domains: ['vygocxhtbghtwewyrymq.supabase.co'],
  },
  site: {
    // TODO: reemplazar por el dominio real de produccion (o definir NUXT_PUBLIC_SITE_URL)
    url: siteUrl,
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