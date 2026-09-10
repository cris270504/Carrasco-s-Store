const RESEND_API_BASE = 'https://api.resend.com'

function getResendKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('Resend no esta configurado (falta RESEND_API_KEY en .env)')
  }
  return key
}

function getFrom() {
  return process.env.RESEND_FROM_EMAIL || 'Carrasco Store <onboarding@resend.dev>'
}

// Envio generico. Igual que WhatsApp: si falta la API key no explota, solo
// devuelve { skipped: true } (los avisos no deben tumbar una venta).
export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
}): Promise<{ ok: boolean, skipped?: boolean }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, skipped: true }

  try {
    await $fetch(`${RESEND_API_BASE}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getResendKey()}` },
      body: { from: getFrom(), to: params.to, subject: params.subject, html: params.html },
    })
    return { ok: true }
  }
  catch (err) {
    console.error('[resend] error enviando correo:', (err as { data?: unknown })?.data ?? err)
    return { ok: false }
  }
}

export async function sendLicenseEmail(params: { to: string, productName: string, code: string }) {
  const key = getResendKey()

  await $fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: {
      from: getFrom(),
      to: params.to,
      subject: `Tu licencia: ${params.productName}`,
      html: `<p>Gracias por tu compra en Carrasco Store.</p>`
        + `<p><strong>${params.productName}</strong></p>`
        + `<p>Tu código: <code style="font-size:1.1em">${params.code}</code></p>`,
    },
  })
}
