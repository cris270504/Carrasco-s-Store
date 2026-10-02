import { eq } from 'drizzle-orm'
import { storeSettings } from '../database/schema'
import { FLAT_SHIPPING_RATE, IGV_RATE } from '../../shared/utils/pricing'
import { MP_MIN_AMOUNT_PEN } from './mercadopago'

const SETTINGS_ID = 1

export interface HomeTrustBadge {
  icon: string
  text: string
}

export interface LegalSection {
  title: string
  body: string
}

export interface StoreSettingsData {
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

// Fila unica de configuracion (id=1). Si todavia no existe (proyecto recien
// migrado, admin nunca guardo), se usa el fallback de shared/utils/pricing.ts
// en vez de fallar, para no romper el carrito/checkout.
export async function getStoreSettings(): Promise<StoreSettingsData> {
  const row = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, SETTINGS_ID) })
  return {
    shippingFlatRate: row ? Number(row.shippingFlatRate) : FLAT_SHIPPING_RATE,
    whatsappNumber: row?.whatsappNumber ?? null,
    whatsappCta: row?.whatsappCta ?? null,
    offerCountdownEndsAt: row?.offerCountdownEndsAt ? new Date(row.offerCountdownEndsAt).toISOString() : null,
    offerCountdownTitle: row?.offerCountdownTitle ?? null,
    offerCountdownUrl: row?.offerCountdownUrl ?? null,

    storeName: row?.storeName || 'Carrasco Store',
    logoUrl: row?.logoUrl ?? null,
    faviconUrl: row?.faviconUrl ?? null,

    igvRate: row ? Number(row.igvRate) : IGV_RATE,
    lowStockThreshold: row?.lowStockThreshold ?? 5,
    mpMinAmount: row ? Number(row.mpMinAmount) : MP_MIN_AMOUNT_PEN,
    currencyCode: row?.currencyCode || 'PEN',
    catalogMinPrice: row ? Number(row.catalogMinPrice) : 0,
    catalogMaxPrice: row ? Number(row.catalogMaxPrice) : 2000,

    physicalEnabled: row?.physicalEnabled ?? true,
    digitalEnabled: row?.digitalEnabled ?? true,
    serviceEnabled: row?.serviceEnabled ?? true,

    ownerWhatsappNumbers: row?.ownerWhatsappNumbers ?? null,
    senderEmail: row?.senderEmail ?? null,
    facebookUrl: row?.facebookUrl ?? null,
    instagramUrl: row?.instagramUrl ?? null,
    tiktokUrl: row?.tiktokUrl ?? null,

    homeHeroBadge: row?.homeHeroBadge ?? null,
    homeHeroTitle: row?.homeHeroTitle ?? null,
    homeHeroSubtitle: row?.homeHeroSubtitle ?? null,
    homeTrustBadges: (row?.homeTrustBadges as HomeTrustBadge[] | null) ?? null,

    legalTermsSections: (row?.legalTermsSections as LegalSection[] | null) ?? null,
    legalPrivacySections: (row?.legalPrivacySections as LegalSection[] | null) ?? null,

    updatedAt: row?.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  }
}

// Actualiza solo los campos presentes en `patch`. Upsert sobre la fila id=1.
export async function updateStoreSettings(patch: Partial<{
  shippingFlatRate: number
  whatsappNumber: string | null
  whatsappCta: string | null
  offerCountdownEndsAt: Date | null
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
}>) {
  const set: Partial<typeof storeSettings.$inferInsert> = { updatedAt: new Date() }
  if (patch.shippingFlatRate !== undefined) set.shippingFlatRate = patch.shippingFlatRate.toFixed(2)
  if ('whatsappNumber' in patch) set.whatsappNumber = patch.whatsappNumber || null
  if ('whatsappCta' in patch) set.whatsappCta = patch.whatsappCta || null
  if ('offerCountdownEndsAt' in patch) set.offerCountdownEndsAt = patch.offerCountdownEndsAt ?? null
  if ('offerCountdownTitle' in patch) set.offerCountdownTitle = patch.offerCountdownTitle || null
  if ('offerCountdownUrl' in patch) set.offerCountdownUrl = patch.offerCountdownUrl || null

  if ('storeName' in patch) set.storeName = patch.storeName || 'Carrasco Store'
  if ('logoUrl' in patch) set.logoUrl = patch.logoUrl || null
  if ('faviconUrl' in patch) set.faviconUrl = patch.faviconUrl || null

  if (patch.igvRate !== undefined) set.igvRate = patch.igvRate.toFixed(4)
  if (patch.lowStockThreshold !== undefined) set.lowStockThreshold = patch.lowStockThreshold
  if (patch.mpMinAmount !== undefined) set.mpMinAmount = patch.mpMinAmount.toFixed(2)
  if ('currencyCode' in patch) set.currencyCode = patch.currencyCode || 'PEN'
  if (patch.catalogMinPrice !== undefined) set.catalogMinPrice = patch.catalogMinPrice.toFixed(2)
  if (patch.catalogMaxPrice !== undefined) set.catalogMaxPrice = patch.catalogMaxPrice.toFixed(2)

  if (patch.physicalEnabled !== undefined) set.physicalEnabled = patch.physicalEnabled
  if (patch.digitalEnabled !== undefined) set.digitalEnabled = patch.digitalEnabled
  if (patch.serviceEnabled !== undefined) set.serviceEnabled = patch.serviceEnabled

  if ('ownerWhatsappNumbers' in patch) set.ownerWhatsappNumbers = patch.ownerWhatsappNumbers || null
  if ('senderEmail' in patch) set.senderEmail = patch.senderEmail || null
  if ('facebookUrl' in patch) set.facebookUrl = patch.facebookUrl || null
  if ('instagramUrl' in patch) set.instagramUrl = patch.instagramUrl || null
  if ('tiktokUrl' in patch) set.tiktokUrl = patch.tiktokUrl || null

  if ('homeHeroBadge' in patch) set.homeHeroBadge = patch.homeHeroBadge || null
  if ('homeHeroTitle' in patch) set.homeHeroTitle = patch.homeHeroTitle || null
  if ('homeHeroSubtitle' in patch) set.homeHeroSubtitle = patch.homeHeroSubtitle || null
  if ('homeTrustBadges' in patch) set.homeTrustBadges = patch.homeTrustBadges ?? null

  if ('legalTermsSections' in patch) set.legalTermsSections = patch.legalTermsSections ?? null
  if ('legalPrivacySections' in patch) set.legalPrivacySections = patch.legalPrivacySections ?? null

  await db.insert(storeSettings)
    .values({ id: SETTINGS_ID, ...set })
    .onConflictDoUpdate({ target: storeSettings.id, set })

  return getStoreSettings()
}
