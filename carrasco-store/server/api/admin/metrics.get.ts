import { getEffectiveStock, isOutOfStock } from '../../../shared/utils/stock'

const PAID_STATUSES = new Set(['paid', 'processing', 'shipped', 'completed'])

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfISOWeek(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay() // 0 (dom) - 6 (sab)
  const diff = (day === 0 ? -6 : 1) - day // retrocede hasta el lunes
  d.setDate(d.getDate() + diff)
  return d
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const now = new Date()
  const today = startOfDay(now)
  const weekStart = startOfISOWeek(now)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [allOrders, allProducts, authUsers] = await Promise.all([
    db.query.orders.findMany(),
    db.query.products.findMany({ with: { variants: true } }),
    listAllAuthUsers(event),
  ])

  let salesThisMonth = 0
  let salesLastMonth = 0
  let pendingOrders = 0
  let pendingOrdersToday = 0
  const weeklySales = [0, 0, 0, 0, 0, 0, 0]

  for (const order of allOrders) {
    const createdAt = new Date(order.createdAt)
    const total = Number(order.total)
    const isPaid = PAID_STATUSES.has(order.status)

    if (order.status === 'pending_payment') {
      pendingOrders += 1
      if (createdAt >= today) pendingOrdersToday += 1
    }

    if (isPaid) {
      if (createdAt >= monthStart) salesThisMonth += total
      else if (createdAt >= lastMonthStart && createdAt < monthStart) salesLastMonth += total

      const dayIndex = Math.floor((createdAt.getTime() - weekStart.getTime()) / 86_400_000)
      if (dayIndex >= 0 && dayIndex < 7) weeklySales[dayIndex] += total
    }
  }

  const salesChangePct = salesLastMonth > 0
    ? Math.round(((salesThisMonth - salesLastMonth) / salesLastMonth) * 100)
    : null

  const activeProducts = allProducts.filter(p => p.isActive).length
  const outOfStockCount = allProducts.filter(isOutOfStock).length

  const lowStock = allProducts
    .filter(p => p.type === 'physical')
    .map(p => ({ name: p.name, stock: getEffectiveStock(p) }))
    .filter(p => p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  const newCustomers = authUsers.filter(u => new Date(u.createdAt) >= monthStart).length
  const newCustomersThisWeek = authUsers.filter(u => new Date(u.createdAt) >= weekStart).length

  const nameByUserId = toUserNameMap(authUsers)
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(order => ({
      id: order.id,
      customer: nameByUserId.get(order.userId) ?? 'Usuario eliminado',
      total: Number(order.total),
      status: order.status,
    }))

  return {
    salesThisMonth,
    salesChangePct,
    pendingOrders,
    pendingOrdersToday,
    activeProducts,
    outOfStockCount,
    newCustomers,
    newCustomersThisWeek,
    weeklySales,
    lowStock,
    recentOrders,
  }
})
