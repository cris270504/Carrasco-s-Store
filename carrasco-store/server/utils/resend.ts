const RESEND_API_BASE = 'https://api.resend.com'

function getResendKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('Resend no esta configurado (falta RESEND_API_KEY en .env)')
  }
  return key
}

export async function sendLicenseEmail(params: { to: string, productName: string, code: string }) {
  const key = getResendKey()
  const from = process.env.RESEND_FROM_EMAIL || 'Carrasco Store <onboarding@resend.dev>'

  await $fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: {
      from,
      to: params.to,
      subject: `Tu licencia: ${params.productName}`,
      html: `<p>Gracias por tu compra en Carrasco Store.</p>`
        + `<p><strong>${params.productName}</strong></p>`
        + `<p>Tu código: <code style="font-size:1.1em">${params.code}</code></p>`,
    },
  })
}
