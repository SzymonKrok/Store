'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../axios'
import { getOrCreateSessionId, clearSessionId } from './cart'
import type { ShippingAddress, BillingAddress } from '@store/validation'

export interface Order {
  id: string
  userId: string | null
  status: string
  subtotal: string
  discountAmount: string
  shippingCost: string
  total: string
  invoiceUrl: string | null
  createdAt: string
  shippingAddress: ShippingAddress
  items: Array<{
    id: string
    productName: string
    variantSku: string
    variantAttributes: Record<string, string>
    quantity: number
    priceAtPurchase: string
  }>
  returnRequest?: { status: 'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'REFUNDED' } | null
}

export interface CreateOrderPayload {
  shippingAddress: ShippingAddress
  billingAddress?: BillingAddress
  couponCode?: string
  deliveryMethod: 'COURIER' | 'PARCEL_LOCKER'
  lockerCode?: string
  shippingPointDetails?: { name: string; addressLine1: string; addressLine2: string }
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

export interface OrdersPage {
  items: Order[]
  total: number
  page: number
  totalPages: number
}

export function useOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: async () => {
      const { data } = await apiClient.get<OrdersPage>('/orders', { params: { page, limit: 10 } })
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
