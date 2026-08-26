import { digitalLicenses, productVariants, products, serviceDetails } from '../../../database/schema'
import { isValidProductType } from '../../../../shared/utils/productTypes'

interface VariantInput {
  name: string
  value: string
  priceModifier?: number
  stock?: number
  sku?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)

  const name = String(body.name ?? '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'El nombre es requerido' })
  }

  if (!isValidProductType(body.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de producto inválido' })
  }
  const type = body.type as 'physical' | 'digital' | 'service'

  const price = Number(body.price)
  if (!Number.isFinite(price) || price <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'El precio debe ser un número mayor a 0' })
  }

  const variants: VariantInput[] = Array.isArray(body.variants)
    ? body.variants.filter((v: VariantInput) => v?.name?.trim() && v?.value?.trim())
    : []

  let stock: number | null = null
  if (type === 'physical' && variants.length === 0) {
    stock = Number(body.stock)
    if (!Number.isInteger(stock) || stock < 0) {
      throw createError({ statusCode: 400, statusMessage: 'El stock debe ser un número entero mayor o igual a 0' })
    }
  }

  if (type === 'service') {
    const duration = Number(body.durationMinutes)
    if (!Number.isInteger(duration) || duration <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'La duración del servicio debe ser un número entero mayor a 0' })
    }
    if (body.defaultModality !== 'remote' && body.defaultModality !== 'in_person') {
      throw createError({ statusCode: 400, statusMessage: 'Modalidad inválida' })
    }
  }

  const slug = await generateUniqueSlug(name)

  const [product] = await db.insert(products).values({
    name,
    slug,
    description: body.description ? String(body.description).trim() : null,
    brand: body.brand ? String(body.brand).trim() : null,
    categoryId: typeof body.categoryId === 'string' && body.categoryId.trim() ? body.categoryId.trim() : null,
    price: price.toFixed(2),
    type,
    stock,
    requiresShipping: type === 'physical' ? body.requiresShipping !== false : false,
    images: Array.isArray(body.images)
      ? body.images.filter((url: unknown) => typeof url === 'string' && url.trim()).map((url: string) => url.trim())
      : [],
    isActive: true,
  }).returning()

  if (!product) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo crear el producto' })
  }

  if (type === 'physical' && variants.length > 0) {
    await db.insert(productVariants).values(variants.map(v => ({
      productId: product.id,
      name: v.name.trim(),
      value: v.value.trim(),
      priceModifier: v.priceModifier ? Number(v.priceModifier).toFixed(2) : '0',
      stock: Number.isInteger(v.stock) ? Number(v.stock) : 0,
      sku: v.sku ? String(v.sku).trim() : null,
    })))
  }

  if (type === 'service') {
    await db.insert(serviceDetails).values({
      productId: product.id,
      durationMinutes: Number(body.durationMinutes),
      defaultModality: body.defaultModality,
    })
  }

  if (type === 'digital') {
    const codes: string[] = Array.isArray(body.licenseCodes)
      ? body.licenseCodes.map((c: unknown) => String(c).trim()).filter(Boolean)
      : []
    if (codes.length > 0) {
      await db.insert(digitalLicenses).values(codes.map(code => ({
        productId: product.id,
        code: encryptLicenseCode(code),
        status: 'available' as const,
      })))
    }
  }

  return product
})
