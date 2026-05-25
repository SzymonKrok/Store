import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../axios'

export interface AdminOrder {
  id: string
  status: string
  subtotal: string
  discountAmount: string
  total: string
  deliveryMethod: string
  lockerCode: string | null
  wantsInvoice: boolean
  companyName: string | null
  taxId: string | null
  invoiceUrl: string | null
  shippingLabelUrl: string | null
  stripeSessionId: string | null
  shippingAddress: Record<string, string>
  createdAt: string
  userId: string | null
  user: { email: string } | null
  guestEmail: string | null
  items: Array<{
    id: string
    productName: string
    variantSku: string
    variantAttributes: Record<string, string>
    quantity: number
    priceAtPurchase: string
  }>
}

export function useAdminOrders(page: number, status?: string) {
  return useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)
      const { data } = await apiClient.get<{
        items: AdminOrder[]
        total: number
        totalPages: number
      }>(`/admin/orders?${params}`)
      return data
    },
  })
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminOrder>(`/orders/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/admin/orders/${id}/status`, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  })
}

export function useRegenerateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<{ invoiceUrl: string | null }>(
        `/admin/orders/${id}/regenerate-invoice`,
      )
      return data
    },
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['admin-order', id] }),
  })
}

export function useGenerateLabel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, parcelSize, parcelWeight }: { id: string; parcelSize: string; parcelWeight: number }) => {
      await apiClient.post(`/admin/orders/${id}/generate-label`, { parcelSize, parcelWeight })
    },
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['admin-order', id] }),
  })
}
