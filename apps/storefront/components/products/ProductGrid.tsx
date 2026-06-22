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
    q: searchParams.get('q') ?? initialQuery?.q,
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
      <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-ink/95 backdrop-blur-md border-b border-ink-600 shadow-[0_4px_30px_rgba(0,0,0,0.4)] mb-10">
        <ProductFilters query={query} />
      </div>

      {isLoading ? (
        <GridSkeleton />
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <span className="font-display text-3xl italic text-gold">L</span>
          </div>
          <div className="text-center">
            <p className="font-medium text-cream mb-1.5">Brak produktów</p>
            <p className="text-cream-muted text-sm">Spróbuj zmienić filtry lub przeglądaj całą kolekcję.</p>
          </div>
        </div>
      ) : (
        <>
          {data && (
            <p className="text-xs text-cream-muted uppercase tracking-[0.15em] mb-6">
              {data.total} {data.total === 1 ? 'produkt' : 'produktów'}
            </p>
          )}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10"
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
                className="p-2.5 rounded-xl text-cream-muted hover:text-gold hover:bg-ink-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Poprzednia strona"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-cream-muted text-sm tabular-nums">
                {currentPage} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= data.totalPages}
                className="p-2.5 rounded-xl text-cream-muted hover:text-gold hover:bg-ink-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-ink-700 rounded-xl" />
          <div className="pt-3.5 space-y-2 flex flex-col items-center">
            <div className="h-2.5 bg-ink-700 rounded w-1/3" />
            <div className="h-3.5 bg-ink-700 rounded w-3/4" />
            <div className="h-4 bg-gold/10 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
