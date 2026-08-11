export interface OrderItemLicense {
  id: string
  status: 'available' | 'reserved' | 'delivered'
  code: string
  deliveredAt: string | null
}

export interface OrderItemBooking {
  id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  modality: 'remote' | 'in_person'
  scheduledAt: string | null
  notes: string | null
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId: string | null
  itemType: 'physical' | 'digital' | 'service'
  quantity: number
  unitPrice: string
  product: {
    name: string
    slug: string
    images: string[] | null
  }
  booking: OrderItemBooking | null
  license: OrderItemLicense | null
}

export interface Order {
  id: string
  status: 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded'
  subtotal: string
  tax: string
  shippingCost: string
  total: string
  createdAt: string
  items: OrderItem[]
}
