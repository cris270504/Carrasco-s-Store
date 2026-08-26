import { eq } from 'drizzle-orm'
import { storeSettings } from '../database/schema'
import { FLAT_SHIPPING_RATE } from '../../shared/utils/pricing'

const SETTINGS_ID = 1

// Fila unica de configuracion (id=1). Si todavia no existe (proyecto recien
// migrado, admin nunca guardo), se usa el fallback de shared/utils/pricing.ts
// en vez de fallar, para no romper el carrito/checkout.
export async function getStoreSettings() {
  const row = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, SETTINGS_ID) })
  return {
    shippingFlatRate: row ? Number(row.shippingFlatRate) : FLAT_SHIPPING_RATE,
    updatedAt: row?.updatedAt ?? null,
  }
}

export async function updateShippingRate(rate: number) {
  const [row] = await db.insert(storeSettings)
    .values({ id: SETTINGS_ID, shippingFlatRate: rate.toFixed(2) })
    .onConflictDoUpdate({
      target: storeSettings.id,
      set: { shippingFlatRate: rate.toFixed(2), updatedAt: new Date() },
    })
    .returning()

  return { shippingFlatRate: Number(row!.shippingFlatRate), updatedAt: row!.updatedAt }
}
