// Regla unica de stock efectivo para un producto fisico (suma de variantes, o
// el stock del producto cuando no tiene variantes). Vive en shared/ porque el
// panel admin (metrics, listado de productos) y el detalle de producto
// necesitan la MISMA cifra — antes estaba reimplementada por separado en cada
// endpoint, con sutiles diferencias de semantica entre pantallas.
export interface StockAwareProduct {
  type: 'physical' | 'digital' | 'service'
  stock: number | null
  variants: { stock: number | null }[]
}

export function getEffectiveStock(product: StockAwareProduct): number {
  if (product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
  }
  return product.stock ?? 0
}

export function isOutOfStock(product: StockAwareProduct): boolean {
  if (product.type !== 'physical') return false
  return getEffectiveStock(product) <= 0
}
