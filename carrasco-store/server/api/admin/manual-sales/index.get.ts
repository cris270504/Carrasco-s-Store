import { and, desc, gte, lte } from 'drizzle-orm'
import { manualSales } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const conditions = []
  if (typeof query.from === 'string' && query.from) {
    const from = new Date(query.from)
    if (!Number.isNaN(from.getTime())) conditions.push(gte(manualSales.soldAt, from))
  }
  if (typeof query.to === 'string' && query.to) {
    const to = new Date(query.to)
    if (!Number.isNaN(to.getTime())) conditions.push(lte(manualSales.soldAt, to))
  }

  const rows = await db.query.manualSales.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(manualSales.soldAt)],
    with: {
      product: { columns: { name: true } },
      supplier: { columns: { name: true } },
    },
  })

  return rows.map((r) => {
    const price = Number(r.unitPrice)
    const cost = Number(r.unitCost)
    return {
      id: r.id,
      description: r.product?.name ?? r.description,
      customerName: r.customerName,
      supplier: r.supplier?.name ?? null,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      unitCost: r.unitCost,
      channel: r.channel,
      notes: r.notes,
      soldAt: r.soldAt,
      revenue: Math.round(price * r.quantity * 100) / 100,
      profit: Math.round((price - cost) * r.quantity * 100) / 100,
    }
  })
})
