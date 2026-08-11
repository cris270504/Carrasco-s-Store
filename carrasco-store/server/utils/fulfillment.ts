import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { serverSupabaseServiceRole } from '#supabase/server'
import {
  digitalLicenses,
  orderItems,
  orders,
  productVariants,
  products,
  serviceBookings,
  serviceDetails,
} from '../database/schema'

type OrderItem = typeof orderItems.$inferSelect

// Se dispara desde el webhook de Mercado Pago cuando el pago queda 'approved'.
// El guard sobre order.status hace la funcion idempotente ante reintentos del webhook.
export async function fulfillOrder(event: H3Event, orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
  if (!order || order.status !== 'pending_payment') {
    return
  }

  const items = await db.query.orderItems.findMany({ where: eq(orderItems.orderId, orderId) })

  for (const item of items) {
    if (item.itemType === 'physical') {
      await fulfillPhysical(item)
    }
    else if (item.itemType === 'digital') {
      await fulfillDigital(event, item, order.userId)
    }
    else if (item.itemType === 'service') {
      await fulfillService(item, order.userId)
    }
  }

  await db.update(orders).set({ status: 'paid' }).where(eq(orders.id, orderId))
}

async function fulfillPhysical(item: OrderItem) {
  if (item.variantId) {
    const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.id, item.variantId) })
    if (variant) {
      await db.update(productVariants)
        .set({ stock: Math.max(0, (variant.stock ?? 0) - item.quantity) })
        .where(eq(productVariants.id, item.variantId))
    }
    return
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) })
  if (product) {
    await db.update(products)
      .set({ stock: Math.max(0, (product.stock ?? 0) - item.quantity) })
      .where(eq(products.id, item.productId))
  }
}

async function fulfillDigital(event: H3Event, item: OrderItem, userId: string) {
  const license = await db.query.digitalLicenses.findFirst({
    where: and(eq(digitalLicenses.productId, item.productId), eq(digitalLicenses.status, 'available')),
  })
  if (!license) return // sin stock de licencias: la orden queda para atencion manual

  await db.update(digitalLicenses)
    .set({ status: 'reserved', orderItemId: item.id })
    .where(eq(digitalLicenses.id, license.id))

  const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) })
  if (!product) return

  try {
    const supabase = serverSupabaseServiceRole(event)
    const { data, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !data.user?.email) throw new Error('sin email de usuario')

    // TODO: cuando exista cifrado a nivel de aplicacion, desencriptar license.code aqui antes de enviarlo
    await sendLicenseEmail({ to: data.user.email, productName: product.name, code: license.code })

    await db.update(digitalLicenses)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(digitalLicenses.id, license.id))
  }
  catch {
    // el codigo queda 'reserved' si falla el envio (credenciales de Resend/Supabase
    // service role faltantes o error de red); permite reintento o entrega manual
  }
}

async function fulfillService(item: OrderItem, userId: string) {
  const detail = await db.query.serviceDetails.findFirst({ where: eq(serviceDetails.productId, item.productId) })

  await db.insert(serviceBookings).values({
    orderItemId: item.id,
    userId,
    productId: item.productId,
    modality: detail?.defaultModality ?? 'remote',
    status: 'pending',
  })
}
