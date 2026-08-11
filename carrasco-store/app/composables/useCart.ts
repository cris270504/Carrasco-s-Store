export interface CartLine {
  id: string
  productId: string
  itemType: 'physical' | 'digital' | 'service'
  name: string
  slug: string
  image: string | null
  variantId: string | null
  variantLabel: string | null
  quantity: number
  unitPrice: number
  preferredModality: 'remote' | 'in_person' | null
}

// Estado de carrito en memoria del cliente. Su forma (itemType, variantId,
// preferredModality...) espeja cartItems de server/database/schema.ts para
// que la migración a POST/PATCH /api/cart/items (Parte 4) sea directa.
export function useCart() {
  const items = useState<CartLine[]>('cart-items', () => [])

  function lineKey(productId: string, variantId: string | null) {
    return `${productId}:${variantId ?? ''}`
  }

  function addItem(line: Omit<CartLine, 'id' | 'quantity'> & { quantity?: number }) {
    const key = lineKey(line.productId, line.variantId)
    const existing = items.value.find(i => lineKey(i.productId, i.variantId) === key)

    if (existing) {
      existing.quantity += line.quantity ?? 1
      return
    }

    items.value.push({ ...line, id: key, quantity: line.quantity ?? 1 })
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function setQuantity(id: string, quantity: number) {
    const line = items.value.find(i => i.id === id)
    if (!line) return
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    line.quantity = quantity
  }

  const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))

  return { items, addItem, removeItem, setQuantity, count, subtotal }
}
