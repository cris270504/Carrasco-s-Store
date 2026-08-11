// Reglas de calculo compartidas entre app/ y server/ para que el resumen
// del carrito y la orden creada en el checkout siempre muestren el mismo total.
export const IGV_RATE = 0.18
export const FLAT_SHIPPING_RATE = 15

export function calcTax(subtotal: number) {
  return Math.round(subtotal * IGV_RATE * 100) / 100
}

export function calcShipping(hasPhysicalItem: boolean) {
  return hasPhysicalItem ? FLAT_SHIPPING_RATE : 0
}
