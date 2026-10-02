import { eq } from 'drizzle-orm'
import { suppliers } from '../database/schema'

// Resuelve y valida un supplierId recibido del cliente: si viene vacio/null
// devuelve null (sin proveedor), si viene con valor debe existir en la tabla.
// Compartido entre manual-sales y costs para no repetir el mismo select.
export async function resolveSupplierId(supplierId: unknown): Promise<string | null> {
  if (!supplierId) return null

  const [supplier] = await db.select({ id: suppliers.id })
    .from(suppliers).where(eq(suppliers.id, String(supplierId))).limit(1)
  if (!supplier) {
    throw createError({ statusCode: 400, statusMessage: 'Proveedor no válido' })
  }
  return supplier.id
}
