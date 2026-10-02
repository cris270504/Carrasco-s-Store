// Solo los 2 correos 100% lineales son plantillas editables (ver
// server/database/schema.ts, comentario de messageTemplates). El aviso a los
// duenos tiene logica condicional y se queda en codigo, no aca.
const ALLOWED_KEYS = new Set(['buyer_confirmation_email', 'license_delivery_email'])

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const key = getRouterParam(event, 'key') || ''
  if (!ALLOWED_KEYS.has(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Esa plantilla no existe o no es editable' })
  }

  const body = await readBody(event)
  const subject = String(body?.subject ?? '').trim()
  const html = String(body?.body ?? '').trim()

  if (!subject || !html) {
    throw createError({ statusCode: 400, statusMessage: 'El asunto y el cuerpo del correo son obligatorios' })
  }

  await upsertMessageTemplate(key, { subject: subject.slice(0, 200), body: html })
  return { ok: true }
})
