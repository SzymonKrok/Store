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
      {/* Sticky filter bar */}
      <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm mb-10">
        <ProductFilters query={query} />
      </div>

      {isLoading ? (
        <GridSkeleton />
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <span className="font-display text-3xl italic text-amber-300">S</span>
          </div>
          <div className="text-center">
            <p className="font-medium text-stone-900 mb-1.5">Brak produktów</p>
            <p className="text-stone-400 text-sm">Spróbuj zmienić filtry lub przeglądaj całą kolekcję.</p>
          </div>
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-16">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2.5 rounded-xl text-stone-500 hover:text-amber-700 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                className="p-2.5 rounded-xl text-stone-500 hover:text-amber-700 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
          <div className="aspect-square bg-stone-100" />
          <div className="p-4 space-y-2.5">
            <div className="h-3.5 bg-stone-100 rounded w-3/4" />
            <div className="h-3.5 bg-stone-100 rounded w-1/2" />
            <div className="h-5 bg-amber-50 rounded w-1/3 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}
