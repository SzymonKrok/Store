'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProducts, type ProductsResponse } from '@/lib/api/products'
import { ProductCard, cardVariants } from './ProductCard'
import { ProductFilters } from './ProductFilters'
import type { ProductQueryDto } from '@store/validation'

interface ProductGridProps {
  initialData?: ProductsResponse
  initialQuery?: Partial<ProductQueryDto>
}

export function ProductGrid({ initialData, initialQuery }: ProductGridProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const query: Partial<ProductQueryDto> = {
    categoryId: searchParams.get('categoryId') ?? initialQuery?.categoryId,
    sortBy:
      (searchParams.get('sortBy') as ProductQueryDto['sortBy']) ??
      initialQuery?.sortBy ??
      'newest',
    page: searchParams.get('page')
      ? Number(searchParams.get('page'))
      : (initialQuery?.page ?? 1),
    minPrice: searchParams.get('minPrice')
      ? Number(searchParams.get('minPrice'))
      : initialQuery?.minPrice,
    maxPrice: searchParams.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : initialQuery?.maxPrice,
  }

  const { data, isLoading } = useProducts(query, initialData)
  const currentPage = query.page ?? 1

  function setPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params}`)
  }

  return (
    <div>
      <ProductFilters query={query} />

      {isLoading ? (
        <GridSkeleton />
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-stone-400 text-base">Brak produktów spełniających kryteria.</p>
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Poprzednia strona"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-stone-500 text-sm tabular-nums">
                {currentPage} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= data.totalPages}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Następna strona"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
          <div className="aspect-square bg-stone-100" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-stone-100 rounded w-3/4" />
            <div className="h-4 bg-stone-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
