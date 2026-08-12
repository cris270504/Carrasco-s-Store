<script setup lang="ts">
useSeoMeta({
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso y compra en Carrasco Store.',
  ogTitle: 'Términos y Condiciones · Carrasco Store',
  ogDescription: 'Términos y condiciones de uso y compra en Carrasco Store.',
})

const lastUpdated = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })

const sections = [
  {
    title: '1. Aceptación de los términos',
    body: 'Al acceder y utilizar Carrasco Store aceptás quedar vinculado por estos Términos y Condiciones, así como por nuestra Política de Privacidad. Si no estás de acuerdo con alguna de estas condiciones, no debés utilizar el sitio ni realizar compras a través de él.',
  },
  {
    title: '2. Productos y servicios ofrecidos',
    body: 'Carrasco Store comercializa productos físicos, licencias digitales y servicios técnicos agendables. Las características, precios, disponibilidad y stock de cada ítem se muestran en su respectiva página de detalle y pueden actualizarse sin previo aviso.',
  },
  {
    title: '3. Cuentas de usuario',
    body: 'Para realizar compras es necesario crear una cuenta con un correo electrónico válido. Sos responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta. Notificanos de inmediato ante cualquier uso no autorizado.',
  },
  {
    title: '4. Precios y pagos',
    body: 'Los precios se expresan en la moneda indicada en el sitio e incluyen los impuestos aplicables salvo que se indique lo contrario. El pago se procesa a través de Mercado Pago; Carrasco Store no almacena datos de tarjetas ni credenciales de pago en sus propios servidores.',
  },
  {
    title: '5. Entrega según tipo de ítem',
    body: 'Los productos físicos se envían a la dirección indicada en el checkout según los plazos informados. Las licencias digitales se entregan mediante un código asociado a tu cuenta una vez confirmado el pago. Los servicios técnicos se agendan según disponibilidad y se gestionan a través de tu panel de usuario.',
  },
  {
    title: '6. Cancelaciones y reembolsos',
    body: 'Las condiciones de cancelación y reembolso varían según el tipo de ítem adquirido. Para productos físicos con defectos de fábrica, licencias digitales no entregadas o servicios no prestados, contactanos a través de los canales de soporte para iniciar el proceso correspondiente.',
  },
  {
    title: '7. Uso aceptable',
    body: 'Te comprometés a utilizar el sitio de forma lícita, sin vulnerar sistemas, intentar accesos no autorizados, ni utilizar la plataforma con fines fraudulentos. Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.',
  },
  {
    title: '8. Propiedad intelectual',
    body: 'Todo el contenido del sitio (marca, diseño, textos, imágenes y software) es propiedad de Carrasco Store o de sus licenciantes y está protegido por las leyes de propiedad intelectual vigentes. Queda prohibida su reproducción sin autorización expresa.',
  },
  {
    title: '9. Limitación de responsabilidad',
    body: 'Carrasco Store no será responsable por daños indirectos, incidentales o consecuentes derivados del uso del sitio o de los productos y servicios adquiridos, en la medida permitida por la legislación aplicable.',
  },
  {
    title: '10. Modificaciones',
    body: 'Podemos actualizar estos Términos y Condiciones en cualquier momento. Los cambios entran en vigencia desde su publicación en esta página. El uso continuado del sitio implica la aceptación de la versión vigente.',
  },
  {
    title: '11. Contacto',
    body: 'Ante cualquier consulta sobre estos términos, podés contactarnos a través de los medios de soporte disponibles en el sitio.',
  },
]
</script>

<template>
  <div class="legal-page">
    <header class="legal-page__header">
      <p class="legal-page__eyebrow">Legal</p>
      <h1>Términos y Condiciones</h1>
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
