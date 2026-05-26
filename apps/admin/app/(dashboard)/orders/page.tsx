'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminOrders } from '@/lib/api/orders'
import { OrdersTable } from '@/components/orders/OrdersTable'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const router = useRouter()

  const { data, isLoading } = useAdminOrders(page, statusFilter === 'ALL' ? undefined : statusFilter)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Zamówienia</h1>

      <OrdersTable
        orders={data?.items}
        isLoading={isLoading}
        onRowClick={(id) => router.push(`/orders/${id}`)}
        statusFilter={statusFilter}
        onStatusFilter={(v) => { setStatusFilter(v); setPage(1) }}
      />

      {data && data.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                aria-disabled={page === data.totalPages}
                className={page === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
