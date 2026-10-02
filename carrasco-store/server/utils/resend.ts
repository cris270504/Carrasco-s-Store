const RESEND_API_BASE = 'https://api.resend.com'

function getResendKey() {
  const key = useRuntimeConfig().resendApiKey
  if (!key) {
    throw new Error('Resend no esta configurado (falta RESEND_API_KEY en .env)')
  }
  return key
}

// El remitente lo elige el admin en /admin/configuracion (senderEmail); si no
// lo configuro, cae a la env var y luego al remitente de prueba de Resend.
async function getFrom() {
  const settings = await getStoreSettings()
  return settings.senderEmail || useRuntimeConfig().resendFromEmail || 'Carrasco Store <onboarding@resend.dev>'
}

// Envio generico. Igual que WhatsApp: si falta la API key no explota, solo
// devuelve { skipped: true } (los avisos no deben tumbar una venta).
export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
}): Promise<{ ok: boolean, skipped?: boolean }> {
  if (!useRuntimeConfig().resendApiKey) return { ok: false, skipped: true }

  try {
    await $fetch(`${RESEND_API_BASE}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getResendKey()}` },
      body: { from: await getFrom(), to: params.to, subject: params.subject, html: params.html },
    })
    return { ok: true }
  }
  catch (err) {
    console.error('[resend] error enviando correo:', (err as { data?: unknown })?.data ?? err)
    return { ok: false }
  }
}

// Las dos plantillas 100% lineales (sin lineas condicionales) son editables
// desde /admin/configuracion via message_templates. Si no hay fila guardada,
// se usa el texto por defecto de abajo — nunca falla por falta de plantilla.
export async function sendLicenseEmail(params: { to: string, productName: string, code: string }) {
  const key = getResendKey()
  const settings = await getStoreSettings()
  const tpl = await getMessageTemplate('license_delivery_email')

  const subject = tpl ? renderTemplate(tpl.subject, { productName: params.productName }) : `Tu licencia: ${params.productName}`
  const html = tpl
    ? renderTemplate(tpl.body, { productName: params.productName, code: params.code, storeName: settings.storeName })
    : `<p>Gracias por tu compra en ${settings.storeName}.</p>`
      + `<p><strong>${params.productName}</strong></p>`
      + `<p>Tu código: <code style="font-size:1.1em">${params.code}</code></p>`

  await $fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: { from: await getFrom(), to: params.to, subject, html },
  })
}
