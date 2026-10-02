import { and, eq, isNotNull, ne } from 'drizzle-orm'
import { products } from '../../../server/database/schema'

// Marcas reales del catalogo publico, para los chips de filtro
// (app/components/ProductFilters.vue). Siempre todas, sin importar el
// filtro de Tipo activo (decision del usuario) — solo se respeta que el
// producto este activo y que su linea de negocio no este desactivada,
// igual que el listado principal en index.get.ts.
export default defineEventHandler(async () => {
  const settings = await getStoreSettings()

  const filters = [eq(products.isActive, true), isNotNull(products.brand)]
  if (!settings.physicalEnabled) filters.push(ne(products.type, 'physical'))
  if (!settings.digitalEnabled) filters.push(ne(products.type, 'digital'))
  if (!settings.serviceEnabled) filters.push(ne(products.type, 'service'))

  const rows = await db.selectDistinct({ brand: products.brand }).from(products).where(and(...filters))

  return rows
    .map(r => r.brand)
    .filter((b): b is string => Boolean(b && b.trim()))
    .sort((a, b) => a.localeCompare(b, 'es'))
})
