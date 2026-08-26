import { desc } from 'drizzle-orm'
import { orders } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: {
      items: { with: { product: { columns: { name: true } } } },
    },
  })

  const authUsers = await listAllAuthUsers(event)
  const nameByUserId = new Map(authUsers.map(u => [u.id, u.fullName || u.email || 'Cliente']))

  return rows.map(order => ({
    id: order.id,
    customer: nameByUserId.get(order.userId) ?? 'Usuario eliminado',
    items: order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
    total: Number(order.total),
    paymentStatus: order.paymentStatus,
    status: order.status,
    date: order.createdAt,
  }))
})
