export interface StoreSettings {
  shippingFlatRate: number
  whatsappNumber: string | null
  whatsappCta: string | null
  offerCountdownEndsAt: string | null
  offerCountdownTitle: string | null
  offerCountdownUrl: string | null
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

  // Carga una sola vez por request/navegacion si aun no hay datos.
  async function ensureSettings() {
    if (settings.value || loading.value) return
    await fetchSettings()
  }

  return { settings, loading, fetchSettings, ensureSettings }
}
