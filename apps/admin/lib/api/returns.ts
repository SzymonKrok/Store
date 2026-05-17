import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export type ReturnStatus = 'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'REFUNDED'

export interface AdminReturnRequest {
  id: string
  status: ReturnStatus
  reason: string
  bankAccount: string
  createdAt: string
  order: {
    id: string
    total: string
    status: string
    user: { email: string } | null
    guestEmail: string | null
  }
}

export function useAdminReturns(page: number, status?: string) {
  return useQuery({
    queryKey: ['admin-returns', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      const { data } = await apiClient.get<{
        items: AdminReturnRequest[]
        total: number
        totalPages: number
      }>(`/admin/returns?${params}`)
      return data
    },
  })
}

export function useUpdateReturnStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReturnStatus }) => {
      await apiClient.patch(`/admin/returns/${id}/status`, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-returns'] }),
  })
}
