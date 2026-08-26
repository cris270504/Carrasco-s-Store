export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const rate = Number(body?.shippingFlatRate)

  if (!Number.isFinite(rate) || rate < 0) {
    throw createError({ statusCode: 400, statusMessage: 'El costo de envío debe ser un número mayor o igual a 0' })
  }

  return updateShippingRate(rate)
})
