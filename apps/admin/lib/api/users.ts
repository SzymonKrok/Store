import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface AdminUser {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  orderCount: number
  orders?: Array<{ id: string; status: string; total: string; createdAt: string }>
}

export function useAdminUsers(page: number) {
  return useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        users: AdminUser[]
        total: number
        totalPages: number
      }>(`/admin/users?page=${page}&limit=20`)
      return data
    },
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUser & { orders: AdminUser['orders'] }>(
        `/admin/users/${id}`,
      )
      return data
    },
    enabled: !!id,
  })
}

export function useToggleUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/admin/users/${id}/role`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-user'] })
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}
