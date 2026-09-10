import { desc } from 'drizzle-orm'
import { manualSales, orderItems, orders } from '../../database/schema'

// Estados de orden que ya representan una venta cobrada (mismo criterio que
// /api/admin/metrics).
const PAID_STATUSES = new Set(['paid', 'processing', 'shipped', 'completed'])

interface Bucket { revenue: number, cost: number, profit: number, store: number, manual: number }
function emptyBucket(): Bucket { return { revenue: 0, cost: 0, profit: 0, store: 0, manual: 0 } }

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function round2(n: number) { return Math.round(n * 100) / 100 }

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - ((todayStart.getDay() + 6) % 7)) // lunes
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const dailyFrom = new Date(todayStart)
  dailyFrom.setDate(dailyFrom.getDate() - 29)

  const [orderRows, orderItemRows, manualRows] = await Promise.all([
    db.select({ id: orders.id, total: orders.total, status: orders.status, createdAt: orders.createdAt })
      .from(orders).orderBy(desc(orders.createdAt)),
    db.select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      unitCost: orderItems.unitCost,
    }).from(orderItems),
    db.select({
      quantity: manualSales.quantity,
      unitPrice: manualSales.unitPrice,
      unitCost: manualSales.unitCost,
      soldAt: manualSales.soldAt,
    }).from(manualSales),
  ])

  // Costo/ingreso por orden a partir de sus lineas.
  const perOrder = new Map<string, { revenue: number, cost: number }>()
  for (const it of orderItemRows) {
    const cur = perOrder.get(it.orderId) ?? { revenue: 0, cost: 0 }
    cur.revenue += Number(it.unitPrice) * it.quantity
    cur.cost += (it.unitCost === null ? 0 : Number(it.unitCost)) * it.quantity
    perOrder.set(it.orderId, cur)
  }

  const daily = new Map<string, Bucket>()
  const monthly = new Map<string, Bucket>()
  const summary = {
    today: emptyBucket(),
    week: emptyBucket(),
    month: emptyBucket(),
    lastMonth: emptyBucket(),
    // Cuántas líneas de venta de tienda todavía no tienen costo cargado
    // (órdenes previas a esta función): su ganancia está sobreestimada.
    storeLinesWithoutCost: 0,
  }

  function add(date: Date, revenue: number, cost: number, source: 'store' | 'manual') {
    const entry = { revenue: round2(revenue), cost: round2(cost), profit: round2(revenue - cost) }
    for (const [map, key] of [[daily, dayKey(date)], [monthly, monthKey(date)]] as const) {
      const b = map.get(key) ?? emptyBucket()
      b.revenue = round2(b.revenue + entry.revenue)
      b.cost = round2(b.cost + entry.cost)
      b.profit = round2(b.profit + entry.profit)
      b[source] += 1
      map.set(key, b)
    }
    for (const [from, bucket] of [
      [todayStart, summary.today], [weekStart, summary.week], [monthStart, summary.month],
    ] as const) {
      if (date >= from) {
        bucket.revenue = round2(bucket.revenue + entry.revenue)
        bucket.cost = round2(bucket.cost + entry.cost)
        bucket.profit = round2(bucket.profit + entry.profit)
        bucket[source] += 1
      }
    }
    if (date >= lastMonthStart && date < monthStart) {
      summary.lastMonth.revenue = round2(summary.lastMonth.revenue + entry.revenue)
      summary.lastMonth.cost = round2(summary.lastMonth.cost + entry.cost)
      summary.lastMonth.profit = round2(summary.lastMonth.profit + entry.profit)
      summary.lastMonth[source] += 1
    }
  }

  for (const o of orderRows) {
    if (!PAID_STATUSES.has(o.status)) continue
    const agg = perOrder.get(o.id) ?? { revenue: Number(o.total), cost: 0 }
    add(new Date(o.createdAt), agg.revenue, agg.cost, 'store')
  }
  for (const it of orderItemRows) {
    if (it.unitCost === null) summary.storeLinesWithoutCost += 1
  }
  for (const m of manualRows) {
    add(new Date(m.soldAt), Number(m.unitPrice) * m.quantity, Number(m.unitCost) * m.quantity, 'manual')
  }

  // Serie diaria continua de los últimos 30 días.
  const dailySeries = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(dailyFrom)
    d.setDate(d.getDate() + i)
    const b = daily.get(dayKey(d)) ?? emptyBucket()
    dailySeries.push({ date: dayKey(d), ...b })
  }

  // Serie mensual continua de los últimos 12 meses.
  const monthlySeries = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const b = monthly.get(monthKey(d)) ?? emptyBucket()
    monthlySeries.push({ month: monthKey(d), ...b })
  }

  const profitChangePct = summary.lastMonth.profit > 0
    ? Math.round(((summary.month.profit - summary.lastMonth.profit) / summary.lastMonth.profit) * 100)
    : null

  return { summary, profitChangePct, daily: dailySeries, monthly: monthlySeries }
})
