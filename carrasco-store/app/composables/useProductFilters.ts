export interface ProductFilters {
  type?: 'service' | 'physical' | 'digital' | ''
  categoryId?: string
  brand?: string
  minPrice?: string
  maxPrice?: string
}

/**
 * Mantiene los filtros sincronizados con la query string (?type=physical&brand=...)
 * para que la búsqueda sea compartible/bookmarkeable, y expone la URL lista
 * para pasar directamente a useFetch('/api/products', { query: filters }).
 */
export function useProductFilters() {
  const route = useRoute()
  const router = useRouter()

  const filters = reactive<ProductFilters>({
    type: (route.query.type as ProductFilters['type']) || '',
    categoryId: (route.query.categoryId as string) || '',
    brand: (route.query.brand as string) || '',
    minPrice: (route.query.minPrice as string) || '',
    maxPrice: (route.query.maxPrice as string) || '',
  })

  watch(filters, (value) => {
    const query: Record<string, string> = {}
    for (const [key, val] of Object.entries(value)) {
      if (val) query[key] = val
    }
    router.replace({ query })
  })

  function resetFilters() {
    filters.type = ''
    filters.categoryId = ''
    filters.brand = ''
    filters.minPrice = ''
    filters.maxPrice = ''
  }

  return { filters, resetFilters }
}
