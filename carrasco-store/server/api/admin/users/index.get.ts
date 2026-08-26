export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const authUsers = await listAllAuthUsers(event)
  const allOrders = await db.query.orders.findMany({
    columns: { userId: true, total: true, status: true },
  })

  const statsByUser = new Map<string, { orders: number, totalSpent: number }>()
  for (const order of allOrders) {
    const entry = statsByUser.get(order.userId) ?? { orders: 0, totalSpent: 0 }
    entry.orders += 1
    // Solo cuenta como "gastado" lo que efectivamente se pago; una orden
    // pendiente o cancelada no debe inflar el total del cliente.
    if (order.status !== 'pending_payment' && order.status !== 'cancelled') {
      entry.totalSpent += Number(order.total)
    }
    statsByUser.set(order.userId, entry)
  }

  return authUsers
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(u => ({
      id: u.id,
      name: u.fullName || u.email || 'Sin nombre',
      email: u.email ?? '—',
      registeredAt: u.createdAt,
      orders: statsByUser.get(u.id)?.orders ?? 0,
      totalSpent: statsByUser.get(u.id)?.totalSpent ?? 0,
      active: u.active,
    }))
})
