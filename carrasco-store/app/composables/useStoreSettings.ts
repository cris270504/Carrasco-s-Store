export interface HomeTrustBadge {
  icon: string
  text: string
}

export interface LegalSection {
  title: string
  body: string
}

export interface StoreSettings {
  shippingFlatRate: number
  whatsappNumber: string | null
  whatsappCta: string | null
  offerCountdownEndsAt: string | null
  offerCountdownTitle: string | null
  offerCountdownUrl: string | null

  storeName: string
  logoUrl: string | null
  faviconUrl: string | null

  igvRate: number
  lowStockThreshold: number
  mpMinAmount: number
  currencyCode: string
  catalogMinPrice: number
  catalogMaxPrice: number

  physicalEnabled: boolean
  digitalEnabled: boolean
  serviceEnabled: boolean

  ownerWhatsappNumbers: string | null
  senderEmail: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null

  homeHeroBadge: string | null
  homeHeroTitle: string | null
  homeHeroSubtitle: string | null
  homeTrustBadges: HomeTrustBadge[] | null

  legalTermsSections: LegalSection[] | null
  legalPrivacySections: LegalSection[] | null

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
