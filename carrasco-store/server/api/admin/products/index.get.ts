import { and, eq, ilike } from 'drizzle-orm'
import { products } from '../../../database/schema'

interface AdminProductRow {
  type: 'service' | 'physical' | 'digital'
  stock: number | null
  variants: { stock: number | null }[]
  licenses: { status: 'available' | 'reserved' | 'delivered' }[]
  serviceDetail: { durationMinutes: number, defaultModality: 'remote' | 'in_person' } | null
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const filters = []
  if (query.type) {
    filters.push(eq(products.type, query.type as 'service' | 'physical' | 'digital'))
  }
  if (query.search) {
    filters.push(ilike(products.name, `%${query.search}%`))
  }

  const rows = await db.query.products.findMany({
    where: filters.length ? and(...filters) : undefined,
    with: {
      variants: true,
      serviceDetail: true,
      licenses: { columns: { status: true } },
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  })

  return rows.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: product.type,
    brand: product.brand,
    price: product.price,
    isActive: product.isActive,
    image: product.images[0] ?? null,
    detail: buildDetail(product),
  }))
})

function buildDetail(product: AdminProductRow): string {
  if (product.type === 'physical') {
    if (product.variants.length > 0) {
      const totalStock = product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
      return `${product.variants.length} variante(s) · ${totalStock} en stock`
    }
    return `${product.stock ?? 0} en stock`
  }

  if (product.type === 'digital') {
    const available = product.licenses.filter(l => l.status === 'available').length
    return `${available} licencia(s) disponible(s)`
  }

  if (product.serviceDetail) {
    const modalityLabel = product.serviceDetail.defaultModality === 'remote' ? 'Remoto' : 'Presencial'
    return `${product.serviceDetail.durationMinutes} min · ${modalityLabel}`
  }

  return '—'
}
