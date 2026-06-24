import { useQuery } from '@tanstack/react-query'
import { api } from '../axios'

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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data } = await api.get<StoreSettings>('/settings')
      return data
    },
    staleTime: 5 * 60_000,
  })
}

export async function fetchStoreSettingsServer(): Promise<StoreSettings> {
  try {
    const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 300 } })
    if (!res.ok) return { id: 1, ga4Id: null, fbPixelId: null, termsOfService: '', privacyPolicy: '', showQuantitySelector: true, showStockBadge: true, showReviews: true, showBestsellers: true, enableGuestCheckout: true }
    return res.json() as Promise<StoreSettings>
  } catch {
    return { id: 1, ga4Id: null, fbPixelId: null, termsOfService: '', privacyPolicy: '', showQuantitySelector: true, showStockBadge: true, showReviews: true, showBestsellers: true, enableGuestCheckout: true }
  }
}
