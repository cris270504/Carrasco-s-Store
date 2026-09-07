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

interface CartResponse {
  id: string
  items: CartLine[]
}

export interface AddCartItemPayload {
  productId: string
  variantId?: string | null
  quantity?: number
  preferredModality?: 'remote' | 'in_person' | null
}

// Estado compartido en el cliente, respaldado por server/api/cart/*.
export function useCart() {
  const cart = useState<CartResponse | null>('cart', () => null)
  const loading = useState('cart-loading', () => false)
  // Token de secuencia: si dos mutaciones se disparan casi juntas (ej. sumar
  // cantidad de dos lineas rapido) y sus respuestas llegan en orden distinto
  // al de envio, la mas vieja ya no debe pisar el estado que dejo la mas
  // nueva ("ultima respuesta gana" segun orden de red, no de request).
  const requestSeq = useState('cart-request-seq', () => 0)

  async function applyRequest<T>(fn: () => Promise<T>): Promise<T> {
    const seq = ++requestSeq.value
    const result = await fn()
    if (seq === requestSeq.value) {
      cart.value = result as unknown as CartResponse
    }
    return result
  }

  async function fetchCart() {
    loading.value = true
    try {
      await applyRequest(() => $fetch<CartResponse>('/api/cart'))
    }
    catch {
      // sin backend disponible, el carrito queda vacio en vez de romper la UI
    }
    finally {
      loading.value = false
    }
  }

  async function addItem(payload: AddCartItemPayload) {
    await applyRequest(() => $fetch<CartResponse>('/api/cart/items', { method: 'POST', body: payload }))
  }

  async function setQuantity(itemId: string, quantity: number) {
    await applyRequest(() => $fetch<CartResponse>(`/api/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } }))
  }

  async function removeItem(itemId: string) {
    await applyRequest(() => $fetch<CartResponse>(`/api/cart/items/${itemId}`, { method: 'DELETE' }))
  }

  const items = computed(() => cart.value?.items ?? [])
  const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))

  return { items, count, subtotal, loading, fetchCart, addItem, setQuantity, removeItem }
}
