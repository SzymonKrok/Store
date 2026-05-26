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
  shippingPointDetails: { name: string; addressLine1: string; addressLine2: string } | null
  wantsInvoice: boolean
  companyName: string | null
  taxId: string | null
  invoiceUrl: string | null
  fakturowniaId: string | null
  shippingLabelUrl: string | null
  trackingNumber: string | null
  stripeSessionId: string | null
  shippingAddress: Record<string, string>
  billingAddress: Record<string, string> | null
  createdAt: string
  updatedAt: string
  userId: string | null
  user: { email: string; firstName: string | null; lastName: string | null; phone: string | null } | null
  guestEmail: string | null
  guestName: string | null
  guestPhone: string | null
  coupon: { code: string } | null
  items: Array<{
    id: string
    productName: string
    variantSku: string
    variantAttributes: Record<string, string>
    quantity: number
    priceAtPurchase: string
  }>
}

export interface OrderFilters {
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  productName?: string
}

export function useAdminOrders(page: number, filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['admin-orders', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.productName) params.set('productName', filters.productName)
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
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-order', id] })
    },
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
