export interface StoreSettings {
  shippingFlatRate: number
  updatedAt: string | null
}

// Estado compartido en el cliente, respaldado por GET /api/settings (publico).
export function useStoreSettings() {
  const settings = useState<StoreSettings | null>('store-settings', () => null)
  const loading = useState('store-settings-loading', () => false)

  async function fetchSettings() {
    loading.value = true
    try {
      settings.value = await $fetch<StoreSettings>('/api/settings')
    }
    catch {
      // sin backend disponible: calcShipping() cae a su fallback fijo
    }
    finally {
      loading.value = false
    }
  }

  return { settings, loading, fetchSettings }
}
