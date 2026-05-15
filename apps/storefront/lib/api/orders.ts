'use client'

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../axios'
import { getOrCreateSessionId, clearSessionId } from './cart'
import type { ShippingAddress } from '@store/validation'

export interface Order {
  id: string
  status: string
  subtotal: string
  discountAmount: string
  total: string
  shippingAddress: ShippingAddress
  items: Array<{
    id: string
    productName: string
    variantSku: string
    variantAttributes: Record<string, string>
    quantity: number
    priceAtPurchase: string
  }>
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async ({
      shippingAddress,
      couponCode,
    }: {
      shippingAddress: ShippingAddress
      couponCode?: string
    }) => {
      const sessionId = getOrCreateSessionId()
      const { data } = await apiClient.post<Order>(
        '/orders',
        { shippingAddress, couponCode, sessionId },
        { headers: { 'x-cart-session': sessionId } },
      )
      clearSessionId()
      return data
    },
  })
}

export function useOrder(id: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get<Order>(`/orders/${id}`)
      return data
    },
  })
}
