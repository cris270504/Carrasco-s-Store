import { eq } from 'drizzle-orm'
import { messageTemplates } from '../database/schema'

// Plantillas de correo editables desde /admin/configuracion. Si no hay fila
// para una key, el remitente usa su propio texto por defecto (ver
// server/utils/resend.ts) — nunca falla por falta de plantilla.
export async function getMessageTemplate(key: string): Promise<{ subject: string, body: string } | null> {
  const row = await db.query.messageTemplates.findFirst({ where: eq(messageTemplates.key, key) })
  return row ? { subject: row.subject, body: row.body } : null
}

export async function listMessageTemplates() {
  return db.query.messageTemplates.findMany()
}

export async function upsertMessageTemplate(key: string, data: { subject: string, body: string }) {
  await db.insert(messageTemplates)
    .values({ key, subject: data.subject, body: data.body, updatedAt: new Date() })
    .onConflictDoUpdate({ target: messageTemplates.key, set: { subject: data.subject, body: data.body, updatedAt: new Date() } })
}

export async function deleteMessageTemplate(key: string) {
  await db.delete(messageTemplates).where(eq(messageTemplates.key, key))
}

// Sustitucion simple {{variable}} -> valor. Sin logica condicional a proposito:
// las plantillas que necesitan lineas condicionales (aviso a los duenos) se
// quedan en codigo, no aca.
export function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}
