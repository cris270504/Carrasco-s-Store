import { desc, eq, inArray } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { digitalLicenses, orders } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion' })
  }

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, user.sub),
    orderBy: [desc(orders.createdAt)],
    with: {
      items: {
        with: {
          product: true,
          booking: true,
        },
      },
    },
  })

  const digitalItemIds = userOrders.flatMap(order =>
    order.items.filter(item => item.itemType === 'digital').map(item => item.id),
  )

  const licenses = digitalItemIds.length > 0
    ? await db.query.digitalLicenses.findMany({ where: inArray(digitalLicenses.orderItemId, digitalItemIds) })
    : []

  // El codigo en la DB esta cifrado (ver server/utils/licenseCrypto.ts) y solo
  // tiene sentido mostrarlo una vez entregado; antes de eso no debe viajar al
  // cliente ni cifrado ni en texto plano.
  function formatLicense(license: typeof licenses[number]) {
    return {
      id: license.id,
      status: license.status,
      deliveredAt: license.deliveredAt,
      code: license.status === 'delivered' ? decryptLicenseCode(license.code) : null,
    }
  }

  return userOrders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      license: item.itemType === 'digital'
        ? (() => {
            const license = licenses.find(l => l.orderItemId === item.id)
            return license ? formatLicense(license) : null
          })()
        : null,
    })),
  }))
})
