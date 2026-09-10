// WhatsApp Cloud API (Meta). Igual que Resend: si faltan las credenciales, la
// funcion no explota, solo devuelve { skipped: true } y el resto del flujo
// sigue. Nunca debe tumbar una venta por un aviso que no salio.
//
// Requiere en .env:
//   WHATSAPP_TOKEN            token de acceso de la app de WhatsApp
//   WHATSAPP_PHONE_NUMBER_ID  id del numero remitente (no el numero)
//   WHATSAPP_OWNER_NUMBERS    numeros de los duenos, E.164 sin '+', separados por coma
// Opcionales (para mensajes fuera de la ventana de 24h, que Meta exige que
// sean plantillas aprobadas):
//   WHATSAPP_OWNER_TEMPLATE / WHATSAPP_BUYER_TEMPLATE   nombre de la plantilla
//   WHATSAPP_TEMPLATE_LANG                              codigo de idioma (default es_PE)

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

interface WaConfig { token: string, phoneNumberId: string }

function getConfig(): WaConfig | null {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return null
  return { token, phoneNumberId }
}

export function getWhatsappOwnerNumbers(): string[] {
  return (process.env.WHATSAPP_OWNER_NUMBERS || '')
    .split(',')
    .map(n => n.replace(/[^\d]/g, '').trim())
    .filter(Boolean)
}

// Normaliza un telefono a E.164 sin '+'. Asume Peru (+51) si viene un numero
// local de 9 digitos.
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  if (digits.length === 9) return `51${digits}`
  return digits
}

async function post(body: Record<string, unknown>): Promise<{ ok: boolean, skipped?: boolean }> {
  const config = getConfig()
  if (!config) return { ok: false, skipped: true }

  try {
    await $fetch(`${GRAPH_BASE}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}` },
      body: { messaging_product: 'whatsapp', ...body },
    })
    return { ok: true }
  }
  catch (err) {
    console.error('[whatsapp] error enviando mensaje:', (err as { data?: unknown })?.data ?? err)
    return { ok: false }
  }
}

export function sendWhatsappText(params: { to: string, body: string }) {
  return post({ to: params.to, type: 'text', text: { preview_url: false, body: params.body } })
}

export function sendWhatsappTemplate(params: {
  to: string
  template: string
  lang?: string
  bodyParams?: string[]
}) {
  return post({
    to: params.to,
    type: 'template',
    template: {
      name: params.template,
      language: { code: params.lang || process.env.WHATSAPP_TEMPLATE_LANG || 'es_PE' },
      components: params.bodyParams?.length
        ? [{ type: 'body', parameters: params.bodyParams.map(text => ({ type: 'text', text })) }]
        : undefined,
    },
  })
}

// Envia un aviso: usa plantilla si hay una configurada (unico modo permitido
// fuera de la ventana de 24h), si no cae a texto plano.
export function sendWhatsappNotice(params: {
  to: string
  text: string
  template?: string
  templateParams?: string[]
}) {
  if (params.template) {
    return sendWhatsappTemplate({ to: params.to, template: params.template, bodyParams: params.templateParams })
  }
  return sendWhatsappText({ to: params.to, body: params.text })
}
