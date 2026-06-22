'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminProducts } from '@/lib/api/products'
import { ProductsTable } from '@/components/products/ProductsTable'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export default function ProductsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)
  const { data, isLoading } = useAdminProducts(page, showArchived)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-cream">Produkty</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? 'Ukryj zarchiwizowane' : 'Pokaż zarchiwizowane'}
          </Button>
          <Button size="sm" onClick={() => router.push('/products/new')}>
            <Plus size={16} className="mr-1" />
            Nowy produkt
          </Button>
        </div>
      </div>

      <ProductsTable products={data?.items} isLoading={isLoading} />

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
