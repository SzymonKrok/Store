'use client'

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../axios'

export function useSubscribeStockNotification() {
  return useMutation({
    mutationFn: async ({ variantId, email }: { variantId: string; email: string }) => {
      const { data } = await apiClient.post<{ ok: boolean }>('/stock-notifications', {
        variantId,
        email,
      })
      return data
    },
  })
}
