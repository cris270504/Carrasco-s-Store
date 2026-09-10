import { eq } from 'drizzle-orm'
import { manualSales, products, suppliers } from '../../../database/schema'

const CHANNELS = ['whatsapp', 'presencial', 'redes', 'otro'] as const

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const body = await readBody(event)

  // Si se elige un producto del catalogo, precio y costo salen de ahi por
  // defecto (pero se pueden sobrescribir); si no, description libre.
  let product: { id: string, name: string, price: string, costPrice: string | null } | undefined
  if (body?.productId) {
    const [p] = await db.select({
      id: products.id, name: products.name, price: products.price, costPrice: products.costPrice,
    }).from(products).where(eq(products.id, String(body.productId))).limit(1)
    if (!p) throw createError({ statusCode: 400, statusMessage: 'Producto no encontrado' })
    product = p
  }

  const description = String(body?.description ?? product?.name ?? '').trim()
  if (!description) {
    throw createError({ statusCode: 400, statusMessage: 'Indica qué se vendió (producto o descripción)' })
  }

  const quantity = Number.parseInt(String(body?.quantity ?? 1), 10)
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'La cantidad debe ser un entero mayor a 0' })
  }

  const rawPrice = body?.unitPrice ?? product?.price
  const unitPrice = Number(rawPrice)
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'El precio de venta debe ser mayor a 0' })
  }

  const rawCost = body?.unitCost ?? product?.costPrice ?? 0
  const unitCost = Number(rawCost)
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    throw createError({ statusCode: 400, statusMessage: 'El costo no puede ser negativo' })
  }

  const channel = CHANNELS.includes(body?.channel) ? body.channel : 'whatsapp'

  let supplierId: string | null = null
  if (body?.supplierId) {
    const [s] = await db.select({ id: suppliers.id })
      .from(suppliers).where(eq(suppliers.id, String(body.supplierId))).limit(1)
    if (!s) throw createError({ statusCode: 400, statusMessage: 'Proveedor no válido' })
    supplierId = s.id
  }

  let soldAt = new Date()
  if (typeof body?.soldAt === 'string' && body.soldAt) {
    const parsed = new Date(body.soldAt)
    if (!Number.isNaN(parsed.getTime())) soldAt = parsed
  }

  const [row] = await db.insert(manualSales).values({
    productId: product?.id ?? null,
    description,
    supplierId,
    customerName: body?.customerName ? String(body.customerName).trim() : null,
    quantity,
    unitPrice: unitPrice.toFixed(2),
    unitCost: unitCost.toFixed(2),
    channel,
    notes: body?.notes ? String(body.notes).trim() : null,
    soldAt,
    createdBy: admin.sub,
  }).returning()

  // Aviso a los duenos (correo + WhatsApp). No bloquea el registro si falla.
  notifyOwnersOfSale({
    kind: 'manual',
    title: `${quantity}× ${description}`,
    total: Math.round(unitPrice * quantity * 100) / 100,
    profit: Math.round((unitPrice - unitCost) * quantity * 100) / 100,
    customer: row!.customerName,
    channel,
  }).catch(err => console.error('[notify] venta particular:', err))

  return row
})
