// Avisos de venta: correo + WhatsApp, a los duenos y al comprador. Todo es
// best-effort — cada canal se traga sus propios errores y nunca corta el
// flujo de venta (ver sendEmail / sendWhatsappNotice).

function getOwnerEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
}

function money(n: number) {
  return `S/ ${n.toFixed(2)}`
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
  redes: 'Redes sociales',
  otro: 'Otro',
}

// ---- Aviso a los duenos ----
export async function notifyOwnersOfSale(params: {
  kind: 'store' | 'manual'
  title: string
  total: number
  profit?: number | null
  customer?: string | null
  channel?: string | null
  orderShortId?: string | null
}) {
  const origin = params.kind === 'store' ? 'Tienda online' : `Venta particular (${CHANNEL_LABELS[params.channel ?? ''] ?? 'directa'})`
  const lines = [
    `Origen: ${origin}`,
    params.orderShortId ? `Orden: #${params.orderShortId}` : null,
    `Detalle: ${params.title}`,
    `Total: ${money(params.total)}`,
    params.profit != null ? `Ganancia estimada: ${money(params.profit)}` : null,
    params.customer ? `Cliente: ${params.customer}` : null,
  ].filter(Boolean) as string[]

  const emails = getOwnerEmails()
  const emailTask = emails.length
    ? sendEmail({
        to: emails,
        subject: `🛒 Nueva venta — ${money(params.total)}`,
        html: `<h2>Nueva venta en Carrasco Store</h2><ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`,
      })
    : Promise.resolve({ ok: false, skipped: true })

  const waText = `🛒 *Nueva venta* — ${money(params.total)}\n${lines.join('\n')}`
  const waTasks = getWhatsappOwnerNumbers().map(to => sendWhatsappNotice({
    to,
    text: waText,
    template: process.env.WHATSAPP_OWNER_TEMPLATE,
    templateParams: [origin, params.title, money(params.total)],
  }))

  await Promise.allSettled([emailTask, ...waTasks])
}

// ---- Aviso al comprador (solo ventas de la tienda) ----
export async function notifyBuyerOfOrder(params: {
  email: string | null | undefined
  phone?: string | null
  orderShortId: string
  items: { name: string, quantity: number }[]
  total: number
}) {
  const itemsText = params.items.map(i => `${i.quantity}× ${i.name}`).join(', ')

  const tasks: Promise<unknown>[] = []

  if (params.email) {
    tasks.push(sendEmail({
      to: params.email,
      subject: `Confirmación de tu compra #${params.orderShortId}`,
      html: `<h2>¡Gracias por tu compra!</h2>`
        + `<p>Tu pedido <strong>#${params.orderShortId}</strong> fue registrado y el pago está confirmado.</p>`
        + `<p><strong>Detalle:</strong> ${itemsText}</p>`
        + `<p><strong>Total:</strong> ${money(params.total)}</p>`
        + `<p>Puedes seguir el estado desde tu panel en Carrasco Store.</p>`,
    }))
  }

  const phone = normalizePhone(params.phone)
  if (phone) {
    tasks.push(sendWhatsappNotice({
      to: phone,
      text: `¡Gracias por tu compra en Carrasco Store! 🛒\nPedido #${params.orderShortId}\n${itemsText}\nTotal: ${money(params.total)}\nEl pago está confirmado.`,
      template: process.env.WHATSAPP_BUYER_TEMPLATE,
      templateParams: [params.orderShortId, itemsText, money(params.total)],
    }))
  }

  await Promise.allSettled(tasks)
}
