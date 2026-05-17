import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface StatsResponse {
  kpis: {
    revenueThisMonth: number
    totalOrders: number
    pendingPaymentOrders: number
    lowStockVariants: number
  }
  chart: Array<{ date: string; revenue: number }>
}

export function useStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<StatsResponse>('/admin/stats')
      return data
    },
  })
}
