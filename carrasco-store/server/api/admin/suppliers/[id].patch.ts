import { eq } from 'drizzle-orm'
import { suppliers } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const body = await readBody(event)
  const updates: Partial<typeof suppliers.$inferInsert> = {}

  if (typeof body?.name === 'string') {
    const name = body.name.trim()
    if (!name) throw createError({ statusCode: 400, statusMessage: 'El nombre no puede quedar vacío' })
    updates.name = name
  }
  if ('notes' in (body ?? {})) {
    updates.notes = body.notes ? String(body.notes).trim() : null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nada que actualizar' })
  }

  try {
    const [row] = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Proveedor no encontrado' })
    return row
  }
  catch (err) {
    if ((err as { statusCode?: number })?.statusCode) throw err
    throw createError({ statusCode: 409, statusMessage: 'Ya existe un proveedor con ese nombre' })
  }
})
