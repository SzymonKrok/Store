import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface StoreSettings {
  id: number
  ga4Id: string | null
  fbPixelId: string | null
  termsOfService: string
  privacyPolicy: string
  showQuantitySelector: boolean
  showStockBadge: boolean
  showReviews: boolean
  showBestsellers: boolean
  enableGuestCheckout: boolean
  shippingCourierCost: string
  shippingLockerCost: string
  freeShipping: boolean
  freeShippingThreshold: string | null
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<StoreSettings>('/settings')
      return data
    },
  })
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<StoreSettings>) => {
      const { data } = await apiClient.put<StoreSettings>('/settings', payload)
      return data
    },
    onSuccess: (data) => qc.setQueryData(['store-settings'], data),
  })
}
