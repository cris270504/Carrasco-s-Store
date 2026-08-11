export interface FavoriteProduct {
  id: string
  productId: string
  name: string
  slug: string
  image: string | null
  price: string
  type: 'physical' | 'digital' | 'service'
}

export function useFavorites() {
  const favorites = useState<FavoriteProduct[]>('favorites', () => [])
  const loading = useState('favorites-loading', () => false)

  async function fetchFavorites() {
    const user = useSupabaseUser()
    if (!user.value) {
      favorites.value = []
      return
    }

    loading.value = true
    try {
      favorites.value = await $fetch<FavoriteProduct[]>('/api/favorites')
    }
    catch {
      favorites.value = []
    }
    finally {
      loading.value = false
    }
  }

  const favoriteIds = computed(() => new Set(favorites.value.map(f => f.productId)))

  function isFavorite(productId: string) {
    return favoriteIds.value.has(productId)
  }

  async function toggleFavorite(productId: string) {
    const user = useSupabaseUser()
    if (!user.value) {
      await navigateTo({ path: '/login', query: { redirect: useRoute().fullPath } })
      return
    }

    if (isFavorite(productId)) {
      await $fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
      favorites.value = favorites.value.filter(f => f.productId !== productId)
    }
    else {
      const created = await $fetch<FavoriteProduct>('/api/favorites', {
        method: 'POST',
        body: { productId },
      })
      favorites.value = [created, ...favorites.value]
    }
  }

  return { favorites, loading, fetchFavorites, isFavorite, toggleFavorite }
}
