export interface ProductVariant {
  id: string
  productId: string
  name: string
  value: string
  priceModifier: string
  stock: number | null
  sku: string | null
}

export interface ServiceDetail {
  id: string
  productId: string
  durationMinutes: number
  defaultModality: 'remote' | 'in_person'
}

export interface Product {
  id: string
  categoryId: string | null
  name: string
  slug: string
  description: string | null
  brand: string | null
  price: string
  type: 'service' | 'physical' | 'digital'
  stock: number | null
  requiresShipping: boolean | null
  specs: Record<string, string | number | boolean>
  images: string[]
  isActive: boolean | null
  variants: ProductVariant[]
  serviceDetail: ServiceDetail | null
}