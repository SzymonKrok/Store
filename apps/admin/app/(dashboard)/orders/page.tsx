'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useAdminOrders, type OrderFilters } from '@/lib/api/orders'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { OrderFiltersBar } from '@/components/orders/OrderFilters'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

function OrdersPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const filters: OrderFilters = {
    status: searchParams.get('status') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    productName: searchParams.get('productName') ?? undefined,
  }

  function buildUrl(updates: Record<string, string | null | undefined>, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val)
      else params.delete(key)
    }
    if (resetPage) params.delete('page')
    return `${pathname}?${params.toString()}`
  }

  function updateFilter(key: keyof OrderFilters, value: string) {
    router.replace(buildUrl({ [key]: value || null }))
  }

  function clearFilters() {
    router.replace(pathname)
  }

  function setPage(p: number) {
    router.replace(buildUrl({ page: String(p) }, false))
  }

  const { data, isLoading } = useAdminOrders(page, filters)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-cream">Zamówienia</h1>
        {data && (
          <span className="text-sm text-stone-400">
            {data.total} {data.total === 1 ? 'zamówienie' : data.total < 5 ? 'zamówienia' : 'zamówień'}
          </span>
        )}
      </div>

      <OrderFiltersBar
        values={filters}
        onChange={updateFilter}
        onClear={clearFilters}
      />

      <OrdersTable
        orders={data?.items}
        isLoading={isLoading}
        onRowClick={(id) => router.push(`/orders/${id}`)}
      />

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-stone-400">
            Strona {page} z {data.totalPages}
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  aria-disabled={page === 1}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                  aria-disabled={page === data.totalPages}
                  className={page === data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersPageContent />
    </Suspense>
  )
}
