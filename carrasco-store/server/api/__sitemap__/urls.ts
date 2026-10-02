import { eq } from 'drizzle-orm'
import { products } from '../../../server/database/schema'

export default defineSitemapEventHandler(async () => {
  const rows = await db.query.products.findMany({
    where: eq(products.isActive, true),
    columns: {
      slug: true,
      createdAt: true,
    },
  })

  return rows.map((product) => ({
    loc: `/producto/${product.slug}`,
    lastmod: product.createdAt,
  }))
})
