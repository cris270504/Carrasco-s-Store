// Formula de margen compartida entre app/ y server/ para que la ganancia
// mostrada en costos, ventas particulares y sus formularios sea siempre la misma.
export function calculateMargin(unitPrice: number, unitCost: number, quantity: number): number {
  return Math.round((unitPrice - unitCost) * quantity * 100) / 100
}
