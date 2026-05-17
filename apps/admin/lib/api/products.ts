import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface AdminProduct {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: string
  isActive: boolean
  categoryId: string
  category: { id: string; name: string }
  images: Array<{ id: string; url: string; position: number }>
  variants: Array<{
    id: string
    sku: string
    price: string
    compareAtPrice: string | null
    stock: number
    attributes: Record<string, string>
    isActive: boolean
  }>
}

export function useAdminProducts(page: number, showArchived: boolean) {
  return useQuery({
    queryKey: ['admin-products', page, showArchived],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (showArchived) params.set('showArchived', 'true')
      const { data } = await apiClient.get<{
        items: AdminProduct[]
        total: number
        totalPages: number
      }>(`/products?${params}`)
      return data
    },
  })
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminProduct>(`/products/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await apiClient.post('/products', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) => {
      const { data } = await apiClient.patch(`/products/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}

export function useArchiveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/products/${id}`, { isActive: false })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}

export function usePresignUpload() {
  return useMutation({
    mutationFn: async (filename: string): Promise<{ uploadUrl: string; publicUrl: string }> => {
      const { data } = await apiClient.post('/upload/presign', { filename })
      return data
    },
  })
}
