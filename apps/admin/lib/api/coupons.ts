import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface AdminCoupon {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FLAT'
  value: string
  expiresAt: string | null
  minOrderValue: string | null
  maxUses: number | null
  limitPerUser: number | null
  usedCount: number
  isActive: boolean
  createdAt: string
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminCoupon[]>('/coupons')
      return data
    },
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await apiClient.post('/coupons', payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: unknown }) => {
      const { data } = await apiClient.patch(`/coupons/${id}`, payload)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })
}

export function useSoftDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/coupons/${id}`, { isActive: false })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })
}

export function useRestoreCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/coupons/${id}`, { isActive: true })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })
}
