import { eq } from 'drizzle-orm'
import { storeSettings } from '../database/schema'
import { FLAT_SHIPPING_RATE } from '../../shared/utils/pricing'

const SETTINGS_ID = 1

export interface StoreSettingsData {
  shippingFlatRate: number
  whatsappNumber: string | null
  whatsappCta: string | null
  offerCountdownEndsAt: string | null
  offerCountdownTitle: string | null
  offerCountdownUrl: string | null
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
}>) {
  const set: Partial<typeof storeSettings.$inferInsert> = { updatedAt: new Date() }
  if (patch.shippingFlatRate !== undefined) set.shippingFlatRate = patch.shippingFlatRate.toFixed(2)
  if ('whatsappNumber' in patch) set.whatsappNumber = patch.whatsappNumber || null
  if ('whatsappCta' in patch) set.whatsappCta = patch.whatsappCta || null
  if ('offerCountdownEndsAt' in patch) set.offerCountdownEndsAt = patch.offerCountdownEndsAt ?? null
  if ('offerCountdownTitle' in patch) set.offerCountdownTitle = patch.offerCountdownTitle || null
  if ('offerCountdownUrl' in patch) set.offerCountdownUrl = patch.offerCountdownUrl || null

  await db.insert(storeSettings)
    .values({ id: SETTINGS_ID, ...set })
    .onConflictDoUpdate({ target: storeSettings.id, set })

  return getStoreSettings()
}
