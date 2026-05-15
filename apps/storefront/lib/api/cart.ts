'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

const SESSION_KEY = 'cart_session_id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function clearSessionId(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY)
}

function cartHeaders() {
  return { 'x-cart-session': getOrCreateSessionId() }
}

export interface CartVariant {
  id: string
  sku: string
  price: string
  stock: number
  attributes: Record<string, string>
  product: {
    id: string
    name: string
    slug: string
    images: Array<{ url: string; altText: string | null }>
  }
}

export interface CartItem {
  id: string
  cartId: string
  variantId: string
  quantity: number
  variant: CartVariant
}

export interface CartResponse {
  id: string
  items: CartItem[]
}

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<CartResponse>('/cart', { headers: cartHeaders() })
      return data
    },
    staleTime: 0,
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      const { data } = await apiClient.post<CartResponse>(
        '/cart/items',
        { variantId, quantity },
        { headers: cartHeaders() },
      )
      return data
    },
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { data } = await apiClient.patch<CartResponse>(
        `/cart/items/${itemId}`,
        { quantity },
        { headers: cartHeaders() },
      )
      return data
    },
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await apiClient.delete<CartResponse>(
        `/cart/items/${itemId}`,
        { headers: cartHeaders() },
      )
      return data
    },
    onSuccess: (data) => qc.setQueryData(['cart'], data),
  })
}

export function useMergeCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.post('/cart/merge', { sessionId })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })
}
