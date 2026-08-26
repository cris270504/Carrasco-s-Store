import { eq } from 'drizzle-orm'
import { isValidProductType } from '../../../shared/utils/productTypes'
import { cartItems } from '../../database/schema'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, { key: 'cart-add', limit: 30, windowMs: 60_000 })

  const body = await readBody(event)

  if (!body?.productId || typeof body.productId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'productId es requerido' })
  }

  const variantId = typeof body.variantId === 'string' ? body.variantId : null
  const rawQuantity = Number(body.quantity)
  const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? Math.min(Math.floor(rawQuantity), 50) : 1

  const found = await getProductForCart(body.productId, variantId)
  if (!found) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado o inactivo' })
  }
  if (!isValidProductType(found.product.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo de producto invalido' })
  }

  const cart = await getOrCreateCart(event)
  const existing = await findCartItem(cart.id, body.productId, variantId)

  if (existing) {
    // El tope de 50 aplicaba solo al insert inicial: sin este Math.min, sumar
    // en llamadas sucesivas (ej. 50 + 50) lo dejaba sin limite real.
    const nextQuantity = Math.min(existing.quantity + quantity, 50)
    if (found.product.type === 'physical' && nextQuantity > found.stock) {
      throw createError({ statusCode: 400, statusMessage: `Stock insuficiente (disponible: ${found.stock})` })
    }
    await db.update(cartItems)
      .set({ quantity: nextQuantity })
      .where(eq(cartItems.id, existing.id))
  }
  else {
    if (found.product.type === 'physical' && quantity > found.stock) {
      throw createError({ statusCode: 400, statusMessage: `Stock insuficiente (disponible: ${found.stock})` })
    }
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId: body.productId,
      variantId,
      itemType: found.product.type,
      quantity,
      unitPrice: String(found.unitPrice),
      preferredModality: found.product.type === 'service' && typeof body.preferredModality === 'string'
        ? body.preferredModality
        : null,
    })
  }

  return getCartResponse(cart.id)
})
