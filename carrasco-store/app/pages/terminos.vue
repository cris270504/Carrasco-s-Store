<script setup lang="ts">
const { settings, ensureSettings } = useStoreSettings()
onMounted(() => { ensureSettings() })
const storeName = computed(() => settings.value?.storeName || 'Carrasco Store')

useSeoMeta({
  title: 'Términos y Condiciones',
  description: () => `Términos y condiciones de uso y compra en ${storeName.value}.`,
  ogTitle: () => `Términos y Condiciones · ${storeName.value}`,
  ogDescription: () => `Términos y condiciones de uso y compra en ${storeName.value}.`,
})

const lastUpdated = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })

// Editable desde /admin/configuracion; sin eso, se usa el texto por defecto.
const defaultSections = [
  {
    title: '1. Aceptación de los términos',
    body: 'Al acceder y utilizar Carrasco Store aceptas quedar vinculado por estos Términos y Condiciones, así como por nuestra Política de Privacidad. Si no estás de acuerdo con alguna de estas condiciones, no debes utilizar el sitio ni realizar compras a través de él.',
  },
  {
    title: '2. Productos y servicios ofrecidos',
    body: 'Carrasco Store comercializa productos físicos, licencias digitales y servicios técnicos agendables. Las características, precios, disponibilidad y stock de cada ítem se muestran en su respectiva página de detalle y pueden actualizarse sin previo aviso.',
  },
  {
    title: '3. Cuentas de usuario',
    body: 'Para realizar compras es necesario crear una cuenta con un correo electrónico válido. Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta. Notifícanos de inmediato ante cualquier uso no autorizado.',
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
    body: 'Las condiciones de cancelación y reembolso varían según el tipo de ítem adquirido. Para productos físicos con defectos de fábrica, licencias digitales no entregadas o servicios no prestados, contáctanos a través de los canales de soporte para iniciar el proceso correspondiente.',
  },
  {
    title: '7. Uso aceptable',
    body: 'Te comprometes a utilizar el sitio de forma lícita, sin vulnerar sistemas, intentar accesos no autorizados, ni utilizar la plataforma con fines fraudulentos. Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.',
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
    body: 'Ante cualquier consulta sobre estos términos, puedes contactarnos a través de los medios de soporte disponibles en el sitio.',
  },
]

const sections = computed(() => settings.value?.legalTermsSections?.length ? settings.value.legalTermsSections : defaultSections)
</script>

<template>
  <LegalPageLayout eyebrow="Legal" title="Términos y Condiciones" :last-updated="lastUpdated" :sections="sections" />
</template>
