import { and, eq, gte, lte, ilike } from 'drizzle-orm'
import { products } from '../../../server/database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters = []

  if (query.type) {
    filters.push(eq(products.type, query.type as 'service' | 'physical' | 'digital'))
  }
  if (query.categoryId) {
    filters.push(eq(products.categoryId, query.categoryId as string))
  }
  if (query.brand) {
    filters.push(ilike(products.brand, `%${query.brand}%`))
  }
  if (query.minPrice) {
    filters.push(gte(products.price, String(query.minPrice)))
  }
  if (query.maxPrice) {
    filters.push(lte(products.price, String(query.maxPrice)))
  }
  filters.push(eq(products.isActive, true))

  const results = await db.query.products.findMany({
    where: and(...filters),
    with: {
      variants: true,
      serviceDetail: true,
    },
    limit: query.limit ? Number(query.limit) : 24,
    offset: query.offset ? Number(query.offset) : 0,
  })

  return results
})