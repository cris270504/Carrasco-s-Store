// Vive en shared/ (Nuxt 4) para que tanto el frontend (app/) como el backend
// (server/) validen contra la MISMA lista, sin duplicar el array en dos sitios.
export const PRODUCT_TYPES = ['service', 'physical', 'digital'] as const
export type ProductType = typeof PRODUCT_TYPES[number]

export function isValidProductType(value: unknown): value is ProductType {
  return typeof value === 'string' && (PRODUCT_TYPES as readonly string[]).includes(value)
}