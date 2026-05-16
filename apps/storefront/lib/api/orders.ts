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

export interface CreateOrderPayload {
  shippingAddress: ShippingAddress
  couponCode?: string
  deliveryMethod: 'COURIER' | 'PARCEL_LOCKER'
  lockerCode?: string
  wantsInvoice?: boolean
  companyName?: string
  taxId?: string
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const sessionId = getOrCreateSessionId()
      const { data: order } = await apiClient.post<Order>(
        '/orders',
        { ...payload, sessionId },
        { headers: { 'x-cart-session': sessionId } },
      )
      clearSessionId()

      // Initiate P24 payment — returns paymentUrl (external P24 hosted page)
      const { data: payment } = await apiClient.post<{ paymentUrl: string }>(
        `/orders/${order.id}/pay`,
        {},
        { headers: { 'x-cart-session': sessionId } },
      )

      return { order, paymentUrl: payment.paymentUrl }
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
