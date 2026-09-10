import { asc, sql } from 'drizzle-orm'
import { manualSales, products, suppliers } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db.select({
    id: suppliers.id,
    name: suppliers.name,
    notes: suppliers.notes,
    createdAt: suppliers.createdAt,
    productCount: sql<number>`(select count(*) from ${products} where ${products.supplierId} = ${suppliers.id})`,
    manualSaleCount: sql<number>`(select count(*) from ${manualSales} where ${manualSales.supplierId} = ${suppliers.id})`,
  })
    .from(suppliers)
    .orderBy(asc(suppliers.name))

  return rows.map(r => ({
    ...r,
    productCount: Number(r.productCount),
    manualSaleCount: Number(r.manualSaleCount),
  }))
})
