import { eq } from 'drizzle-orm'
import { digitalLicenses, productVariants, products, serviceDetails } from '../../../database/schema'

interface VariantInput {
  id?: string
  name: string
  value: string
  priceModifier?: number
  stock?: number
  sku?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id es requerido' })
  }

  const existing = await db.query.products.findFirst({ where: eq(products.id, id) })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado' })
  }

  const body = await readBody(event)

  const name = body.name !== undefined ? String(body.name).trim() : existing.name
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'El nombre es requerido' })
  }

  let price = existing.price
  if (body.price !== undefined) {
    const parsed = Number(body.price)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'El precio debe ser un número mayor a 0' })
    }
    price = parsed.toFixed(2)
  }

  // El tipo del producto es inmutable tras su creación: cambiarlo dejaría
  // huérfanas las tablas de detalle (variantes/licencias/servicio) ya creadas.
  const updates: Partial<typeof products.$inferInsert> = {
    name,
    price,
    description: body.description !== undefined ? (String(body.description).trim() || null) : existing.description,
    brand: body.brand !== undefined ? (String(body.brand).trim() || null) : existing.brand,
    categoryId: body.categoryId !== undefined
      ? (typeof body.categoryId === 'string' && body.categoryId.trim() ? body.categoryId.trim() : null)
      : existing.categoryId,
    images: Array.isArray(body.images)
      ? body.images.filter((url: unknown) => typeof url === 'string' && url.trim()).map((url: string) => url.trim())
      : existing.images,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
  }

  if (existing.type === 'physical') {
    updates.requiresShipping = body.requiresShipping !== undefined ? Boolean(body.requiresShipping) : existing.requiresShipping

    const hasVariants = await db.query.productVariants.findFirst({
      where: eq(productVariants.productId, id),
      columns: { id: true },
    })
    if (!hasVariants && body.stock !== undefined) {
      const stock = Number(body.stock)
      if (!Number.isInteger(stock) || stock < 0) {
        throw createError({ statusCode: 400, statusMessage: 'El stock debe ser un número entero mayor o igual a 0' })
      }
      updates.stock = stock
    }
  }

  await db.update(products).set(updates).where(eq(products.id, id))

  if (existing.type === 'physical' && Array.isArray(body.variants)) {
    for (const variant of body.variants as VariantInput[]) {
      if (!variant?.name?.trim() || !variant?.value?.trim()) continue

      const values = {
        productId: id,
        name: variant.name.trim(),
        value: variant.value.trim(),
        priceModifier: variant.priceModifier ? Number(variant.priceModifier).toFixed(2) : '0',
        stock: Number.isInteger(variant.stock) ? Number(variant.stock) : 0,
        sku: variant.sku ? String(variant.sku).trim() : null,
      }

      if (variant.id) {
        await db.update(productVariants).set(values).where(eq(productVariants.id, variant.id))
      }
      else {
        await db.insert(productVariants).values(values)
      }
    }

    const removedVariantIds: string[] = Array.isArray(body.removedVariantIds) ? body.removedVariantIds : []
    for (const variantId of removedVariantIds) {
      try {
        await db.delete(productVariants).where(eq(productVariants.id, variantId))
      }
      catch {
        // La variante tiene historial en carritos/órdenes (restricción de FK):
        // se conserva; para retirarla de la venta basta con dejar su stock en 0.
      }
    }
  }

  if (existing.type === 'service') {
    const duration = body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined
    const modality = body.defaultModality as 'remote' | 'in_person' | undefined

    if (duration !== undefined && (!Number.isInteger(duration) || duration <= 0)) {
      throw createError({ statusCode: 400, statusMessage: 'La duración del servicio debe ser un número entero mayor a 0' })
    }
    if (modality !== undefined && modality !== 'remote' && modality !== 'in_person') {
      throw createError({ statusCode: 400, statusMessage: 'Modalidad inválida' })
    }

    if (duration !== undefined || modality !== undefined) {
      await db.update(serviceDetails)
        .set({
          ...(duration !== undefined ? { durationMinutes: duration } : {}),
          ...(modality !== undefined ? { defaultModality: modality } : {}),
        })
        .where(eq(serviceDetails.productId, id))
    }
  }

  if (existing.type === 'digital' && Array.isArray(body.newLicenseCodes)) {
    const codes: string[] = body.newLicenseCodes.map((c: unknown) => String(c).trim()).filter(Boolean)
    if (codes.length > 0) {
      await db.insert(digitalLicenses).values(codes.map(code => ({
        productId: id,
        code: encryptLicenseCode(code),
        status: 'available' as const,
      })))
    }
  }

  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: true,
      serviceDetail: true,
      licenses: { columns: { id: true, status: true } },
    },
  })
})
