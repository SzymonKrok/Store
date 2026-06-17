import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface AdminReview {
  id: string
  authorName: string
  rating: number
  comment: string
  approved: boolean
  createdAt: string
  product: { id: string; name: string; slug: string }
}

export function useAdminReviews(page: number, approved?: boolean) {
  return useQuery({
    queryKey: ['admin-reviews', page, approved],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (approved !== undefined) params.set('approved', String(approved))
      const { data } = await apiClient.get<{
        items: AdminReview[]
        total: number
        totalPages: number
      }>(`/admin/reviews?${params}`)
      return data
    },
  })
}

export function useApproveReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/reviews/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })
}

export function useDeleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })
}
