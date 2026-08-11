import type { ProductType } from '../../shared/utils/productTypes'

export interface AdminProductListItem {
  id: string
  name: string
  slug: string
  type: ProductType
  brand: string | null
  price: string
  isActive: boolean | null
  image: string | null
  detail: string
}

export interface AdminProductVariant {
  id?: string
  name: string
  value: string
  priceModifier: string
  stock: number | null
  sku: string | null
}

export interface AdminProductLicense {
  id: string
  status: 'available' | 'reserved' | 'delivered'
}

export interface AdminProductDetail {
  id: string
  categoryId: string | null
  name: string
  slug: string
  description: string | null
  brand: string | null
  price: string
  type: ProductType
  stock: number | null
  requiresShipping: boolean | null
  images: string[]
  isActive: boolean | null
  variants: AdminProductVariant[]
  serviceDetail: { durationMinutes: number, defaultModality: 'remote' | 'in_person' } | null
  licenses: AdminProductLicense[]
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
}
