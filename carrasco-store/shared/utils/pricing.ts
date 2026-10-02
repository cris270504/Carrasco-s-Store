// Reglas de calculo compartidas entre app/ y server/ para que el resumen
// del carrito y la orden creada en el checkout siempre muestren el mismo total.
//
// El precio de cada producto (products.price) es el precio FINAL que paga el
// cliente, con IGV incluido — igual que Falabella, MercadoLibre o Amazon Peru,
// y como exige la normativa de proteccion al consumidor (el precio exhibido
// debe ser el precio a pagar, sin cargos sorpresa). El "IGV" que se muestra en
// el resumen es solo informativo: se EXTRAE del subtotal, nunca se suma aparte.
export const IGV_RATE = 0.18
export const FLAT_SHIPPING_RATE = 15

// Descompone el IGV ya incluido en `subtotal` (subtotal = base * (1 + rate)).
// El rate real se configura en /admin/configuracion (tabla store_settings) y
// se pasa via el parametro `rate`, igual que calcShipping con el envio.
// IGV_RATE queda como fallback mientras no exista fila de configuracion.
export function calcTax(subtotal: number, rate: number = IGV_RATE) {
  return Math.round((subtotal - subtotal / (1 + rate)) * 100) / 100
}

// El costo real se configura en /admin/configuracion (tabla store_settings) y
// se pasa via el parametro `rate`. FLAT_SHIPPING_RATE queda como fallback
// mientras no exista fila de configuracion o no se haya podido cargar aun.
export function calcShipping(hasPhysicalItem: boolean, rate: number = FLAT_SHIPPING_RATE) {
  return hasPhysicalItem ? rate : 0
}
