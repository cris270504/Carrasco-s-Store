import { and, eq, gte, lte, ilike, ne } from 'drizzle-orm'
import { products } from '../../../server/database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const settings = await getStoreSettings()

  const filters = []

  if (query.type) {
    filters.push(eq(products.type, query.type as 'service' | 'physical' | 'digital'))
  }
  // Oculta del catalogo publico las lineas de negocio desactivadas en
  // store_settings, sin afectar al admin (que usa su propio endpoint) ni
  // reactivar el tipo aunque se pida explicitamente por query.type: ambos
  // filtros se combinan con AND dentro de `filters`.
  if (!settings.physicalEnabled) filters.push(ne(products.type, 'physical'))
  if (!settings.digitalEnabled) filters.push(ne(products.type, 'digital'))
  if (!settings.serviceEnabled) filters.push(ne(products.type, 'service'))
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