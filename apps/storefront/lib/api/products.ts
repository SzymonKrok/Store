import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../axios'
import type { ProductQueryDto } from '@store/validation'

export interface ProductImage {
  id: string
  url: string
  altText: string | null
  position: number
}

export interface ProductVariant {
  id: string
  sku: string
  price: number
  stock: number
  attributes: Record<string, string>
  omnibusPrice?: number | null
}

export interface ProductSummary {
  id: string
  name: string
  slug: string
  basePrice: number
  category: { id: string; name: string; slug: string }
  variants: ProductVariant[]
  images: ProductImage[]
}

export interface ProductDetail extends ProductSummary {
  description: string | null
}

export interface ProductsResponse {
  items: ProductSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useProducts(query: Partial<ProductQueryDto> = {}) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: async () => {
      const { data } = await apiClient.get<ProductsResponse>('/products', { params: query })
      return data
    },
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await apiClient.get<ProductDetail>(`/products/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}
