<script setup lang="ts">
useSeoMeta({
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de Carrasco Store.',
  ogTitle: 'Política de Privacidad · Carrasco Store',
  ogDescription: 'Política de privacidad y tratamiento de datos personales de Carrasco Store.',
})

const lastUpdated = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })

const sections = [
  {
    title: '1. Datos que recopilamos',
    body: 'Recopilamos los datos que nos proporcionas al crear una cuenta (nombre, correo electrónico), al completar un pedido (dirección de envío, preferencias de agendamiento) y los datos técnicos generados por el uso del sitio (dirección IP, tipo de dispositivo, páginas visitadas).',
  },
  {
    title: '2. Finalidad del tratamiento',
    body: 'Utilizamos tus datos para gestionar tu cuenta, procesar pedidos, entregar productos y licencias digitales, coordinar servicios técnicos agendados, brindar soporte y mejorar la experiencia del sitio.',
  },
  {
    title: '3. Datos de pago',
    body: 'El procesamiento de pagos se realiza a través de Mercado Pago. Carrasco Store no almacena números de tarjeta ni datos financieros sensibles en sus propios servidores; dicha información es gestionada directamente por la pasarela de pago bajo sus propias políticas de seguridad.',
  },
  {
    title: '4. Compartición de datos',
    body: 'No vendemos tus datos personales a terceros. Podemos compartir información con proveedores estrictamente necesarios para operar el servicio (por ejemplo, transportistas para envíos físicos o la pasarela de pago), quienes están obligados a proteger tu información.',
  },
  {
    title: '5. Conservación de datos',
    body: 'Conservamos tus datos mientras tu cuenta permanezca activa o mientras sea necesario para cumplir con obligaciones legales, contables o fiscales derivadas de tus compras.',
  },
  {
    title: '6. Seguridad',
    body: 'Aplicamos medidas técnicas y organizativas razonables para proteger tu información contra accesos no autorizados, pérdida o alteración. La autenticación de cuentas es gestionada por Supabase Auth.',
  },
  {
    title: '7. Cookies y almacenamiento local',
    body: 'Utilizamos almacenamiento local del navegador para recordar preferencias como el tema visual (claro/oscuro) y mantener tu sesión iniciada. No utilizamos cookies de seguimiento publicitario de terceros.',
  },
  {
    title: '8. Tus derechos',
    body: 'Puedes acceder, corregir o solicitar la eliminación de tus datos personales, así como revocar el consentimiento otorgado, contactándonos a través de los canales de soporte disponibles en el sitio.',
  },
  {
    title: '9. Menores de edad',
    body: 'El sitio está dirigido a usuarios mayores de edad. No recopilamos intencionalmente datos de menores sin el consentimiento de sus padres o tutores.',
  },
  {
    title: '10. Cambios en esta política',
    body: 'Podemos actualizar esta Política de Privacidad periódicamente. Cualquier cambio significativo será reflejado en esta página junto con la fecha de última actualización.',
  },
  {
    title: '11. Contacto',
    body: 'Para consultas sobre el tratamiento de tus datos personales, puedes contactarnos a través de los medios de soporte disponibles en el sitio.',
  },
]
</script>

<template>
  <div class="legal-page">
    <header class="legal-page__header">
      <p class="legal-page__eyebrow">Legal</p>
      <h1>Política de Privacidad</h1>
      <p class="legal-page__updated">Última actualización: {{ lastUpdated }}</p>
    </header>

    <div class="legal-page__body">
      <section v-for="section in sections" :key="section.title" class="legal-page__section">
        <h2>{{ section.title }}</h2>
        <p>{{ section.body }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}
.legal-page__header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.legal-page__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.4rem;
}
.legal-page__header h1 {
  font-size: 1.9rem;
}
.legal-page__updated {
  color: var(--color-ink-muted);
  font-size: 0.85rem;
  margin: 0.6rem 0 0;
}
.legal-page__body {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 2rem 2.25rem;
  box-shadow: var(--shadow-card);
}
.legal-page__section h2 {
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}
.legal-page__section p {
  color: var(--color-ink-muted);
  font-size: 0.92rem;
  margin: 0;
}

@media (max-width: 640px) {
  .legal-page__body {
    padding: 1.5rem;
  }
}
</style>
