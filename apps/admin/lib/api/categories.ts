import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface AdminCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  parent: { id: string; name: string } | null
  _count?: { products: number }
}

export function useCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminCategory[]>('/categories')
      return data
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; slug: string; parentId?: string }) => {
      const { data } = await apiClient.post('/categories', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string; slug: string; parentId?: string } }) => {
      const { data } = await apiClient.patch(`/categories/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })
}
