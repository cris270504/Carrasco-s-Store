import { suppliers } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const name = String(body?.name ?? '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'El nombre del proveedor es requerido' })
  }
  if (name.length > 160) {
    throw createError({ statusCode: 400, statusMessage: 'El nombre es demasiado largo' })
  }

  const notes = body?.notes ? String(body.notes).trim() : null

  try {
    const [row] = await db.insert(suppliers).values({ name, notes }).returning()
    return row
  }
  catch (err) {
    if ((err as { code?: string })?.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Ya existe un proveedor con ese nombre' })
    }
    throw createError({ statusCode: 500, statusMessage: 'No se pudo crear el proveedor' })
  }
})
