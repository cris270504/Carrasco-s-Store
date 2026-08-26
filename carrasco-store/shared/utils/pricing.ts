// Reglas de calculo compartidas entre app/ y server/ para que el resumen
// del carrito y la orden creada en el checkout siempre muestren el mismo total.
export const IGV_RATE = 0.18
export const FLAT_SHIPPING_RATE = 15

export function calcTax(subtotal: number) {
  return Math.round(subtotal * IGV_RATE * 100) / 100
}

// El costo real se configura en /admin/configuracion (tabla store_settings) y
// se pasa via el parametro `rate`. FLAT_SHIPPING_RATE queda como fallback
// mientras no exista fila de configuracion o no se haya podido cargar aun.
export function calcShipping(hasPhysicalItem: boolean, rate: number = FLAT_SHIPPING_RATE) {
  return hasPhysicalItem ? rate : 0
}
