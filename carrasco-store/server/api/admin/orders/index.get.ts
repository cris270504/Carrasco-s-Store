import { desc } from 'drizzle-orm'
import { orders } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: {
      items: { with: { product: { columns: { name: true } } } },
      shippingAddress: true,
    },
  })

  const authUsers = await listAllAuthUsers(event)
  const nameByUserId = toUserNameMap(authUsers)

  return rows.map(order => ({
    id: order.id,
    customer: nameByUserId.get(order.userId) ?? 'Usuario eliminado',
    items: order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
    hasPhysical: order.items.some(item => item.itemType === 'physical'),
    shippingAddress: order.shippingAddress
      ? {
          fullName: order.shippingAddress.fullName,
          line1: order.shippingAddress.line1,
          line2: order.shippingAddress.line2,
          city: order.shippingAddress.city,
          region: order.shippingAddress.region,
          phone: order.shippingAddress.phone,
        }
      : null,
    total: Number(order.total),
    paymentStatus: order.paymentStatus,
    status: order.status,
    date: order.createdAt,
  }))
})
