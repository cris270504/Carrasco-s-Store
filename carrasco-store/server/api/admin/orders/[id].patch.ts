import { eq } from 'drizzle-orm'
import { orders } from '../../../database/schema'

// Transiciones manuales validas para el ciclo de vida de una orden fisica:
// el admin solo puede avanzarla, nunca saltarse el pago ni revivir una
// orden cancelada por este medio.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  paid: ['shipped', 'completed'],
  processing: ['shipped'],
  shipped: ['completed'],
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const body = await readBody(event)
  const nextStatus = body?.status
  if (typeof nextStatus !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'status es requerido' })
  }

  const existing = await db.query.orders.findFirst({ where: eq(orders.id, id), columns: { status: true } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Orden no encontrada' })
  }

  const allowed = ALLOWED_TRANSITIONS[existing.status] ?? []
  if (!allowed.includes(nextStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `No se puede pasar de "${existing.status}" a "${nextStatus}"`,
    })
  }

  const [updated] = await db.update(orders)
    .set({ status: nextStatus as typeof orders.$inferInsert.status })
    .where(eq(orders.id, id))
    .returning({ id: orders.id, status: orders.status })

  return updated
})
