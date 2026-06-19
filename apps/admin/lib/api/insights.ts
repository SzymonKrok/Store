import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../axios'

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type DeliveryMethod = 'COURIER' | 'PARCEL_LOCKER'

export interface InsightsResponse {
  averageOrderValue: number
  newCustomers30d: number
  pendingReviews: number
  pendingReturns: number
  orderStatusBreakdown: Record<OrderStatus, number>
  deliveryMethodSplit: Record<DeliveryMethod, number>
  topProducts: Array<{ productName: string; totalSold: number; totalRevenue: number }>
  topViewed: Array<{ id: string; name: string; slug: string; viewCount: number }>
  topCities: Array<{ city: string; count: number }>
  couponPerformance: Array<{
    code: string
    type: 'PERCENTAGE' | 'FLAT'
    value: number
    redemptions: number
    totalDiscount: number
  }>
  abandonedCarts: Array<{
    id: string
    identifier: string
    itemCount: number
    totalValue: number
    itemPreview: string
    updatedAt: string
  }>
  lowStockVariants: Array<{
    productId: string
    productName: string
    sku: string
    stock: number
    attributes: Record<string, string>
  }>
}

export function useInsights() {
  return useQuery({
    queryKey: ['admin-insights'],
    queryFn: async () => {
      const { data } = await apiClient.get<InsightsResponse>('/admin/insights')
      return data
    },
  })
}
