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
  // Guarda de reentrada compartida por productId: si dos componentes (ej. una
  // tarjeta y la ficha del mismo producto) disparan toggleFavorite casi a la
  // vez, la segunda llamada no debe repetir el POST/DELETE mientras la
  // primera sigue en vuelo (check-then-act no atomico contra el servidor).
  const pending = useState<Set<string>>('favorites-pending', () => new Set())

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

    if (pending.value.has(productId)) return
    pending.value.add(productId)

    try {
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
    finally {
      pending.value.delete(productId)
    }
  }

  return { favorites, loading, fetchFavorites, isFavorite, toggleFavorite }
}
