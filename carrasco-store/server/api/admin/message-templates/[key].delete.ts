// Borra la plantilla guardada: el remitente vuelve a usar el texto por
// defecto embebido en server/utils/resend.ts.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const key = getRouterParam(event, 'key') || ''
  await deleteMessageTemplate(key)
  return { ok: true }
})
