// Validaciones de montos compartidas por los endpoints admin (productos,
// costos y ventas particulares) para no repetir el mismo Number.isFinite.
export function parsePositiveAmount(value: unknown, message = 'El monto debe ser un número mayor a 0'): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw createError({ statusCode: 400, statusMessage: message })
  }
  return parsed
}

export function parseNonNegativeAmount(value: unknown, message = 'El monto no puede ser negativo'): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createError({ statusCode: 400, statusMessage: message })
  }
  return parsed
}
