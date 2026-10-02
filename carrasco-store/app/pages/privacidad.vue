<script setup lang="ts">
const { settings, ensureSettings } = useStoreSettings()
onMounted(() => { ensureSettings() })
const storeName = computed(() => settings.value?.storeName || 'Carrasco Store')

useSeoMeta({
  title: 'Política de Privacidad',
  description: () => `Política de privacidad y tratamiento de datos personales de ${storeName.value}.`,
  ogTitle: () => `Política de Privacidad · ${storeName.value}`,
  ogDescription: () => `Política de privacidad y tratamiento de datos personales de ${storeName.value}.`,
})

const lastUpdated = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })

// Editable desde /admin/configuracion; sin eso, se usa el texto por defecto.
const defaultSections = [
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

const sections = computed(() => settings.value?.legalPrivacySections?.length ? settings.value.legalPrivacySections : defaultSections)
</script>

<template>
  <LegalPageLayout eyebrow="Legal" title="Política de Privacidad" :last-updated="lastUpdated" :sections="sections" />
</template>
