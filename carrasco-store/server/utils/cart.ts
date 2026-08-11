import type { H3Event } from 'h3'
import { randomUUID } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { carts, cartItems, products, productVariants } from '../database/schema'

const CART_COOKIE = 'cart_session_id'

async function resolveCartOwner(event: H3Event) {
  try {
    const user = await serverSupabaseUser(event)
    if (user) {
      return { userId: user.sub, sessionId: null as string | null }
    }
  }
  catch {
    // sin sesion valida: se atiende como invitado
  }

  let sessionId = getCookie(event, CART_COOKIE)
  if (!sessionId) {
    sessionId = randomUUID()
    setCookie(event, CART_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  }
  return { userId: null as string | null, sessionId }
}

export async function getOrCreateCart(event: H3Event) {
  const owner = await resolveCartOwner(event)

  const existing = await db.query.carts.findFirst({
    where: owner.userId ? eq(carts.userId, owner.userId) : eq(carts.sessionId, owner.sessionId!),
  })
  if (existing) return existing

  const [created] = await db.insert(carts).values(owner).returning()
  return created!
}

export async function findCartItem(cartId: string, productId: string, variantId: string | null) {
  return db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cartId),
      eq(cartItems.productId, productId),
      variantId ? eq(cartItems.variantId, variantId) : isNull(cartItems.variantId),
    ),
  })
}

export async function getProductForCart(productId: string, variantId: string | null) {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) })
  if (!product || !product.isActive) return null

  let unitPrice = Number(product.price)

  if (variantId) {
    const variant = await db.query.productVariants.findFirst({ where: eq(productVariants.id, variantId) })
    if (!variant || variant.productId !== productId) return null
    unitPrice += Number(variant.priceModifier ?? 0)
  }

  return { product, unitPrice }
}

function formatCartItem(item: {
  id: string
  productId: string
  variantId: string | null
  itemType: 'physical' | 'digital' | 'service'
  quantity: number
  unitPrice: string
  preferredModality: 'remote' | 'in_person' | null
  product: { name: string, slug: string, images: string[] | null }
  variant: { name: string, value: string } | null
}) {
  return {
    id: item.id,
    productId: item.productId,
    itemType: item.itemType,
    name: item.product.name,
    slug: item.product.slug,
    image: item.product.images?.[0] ?? null,
    variantId: item.variantId,
    variantLabel: item.variant ? `${item.variant.name}: ${item.variant.value}` : null,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    preferredModality: item.preferredModality,
  }
}

export async function getCartResponse(cartId: string) {
  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cartId),
    with: { product: true, variant: true },
  })
  return { id: cartId, items: items.map(formatCartItem) }
}
