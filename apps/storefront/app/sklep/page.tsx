import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductGrid } from '@/components/products/ProductGrid'
import type { ProductsResponse } from '@/lib/api/products'
import type { ProductQueryDto } from '@store/validation'

export const metadata: Metadata = {
  title: 'Sklep | Store',
  description: 'Przeglądaj naszą kolekcję produktów',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchInitialProducts(
  query: Partial<ProductQueryDto>,
): Promise<ProductsResponse | undefined> {
  try {
    const params = new URLSearchParams()
    if (query.categoryId) params.set('categoryId', query.categoryId)
    if (query.minPrice) params.set('minPrice', String(query.minPrice))
    if (query.maxPrice) params.set('maxPrice', String(query.maxPrice))
    if (query.sortBy) params.set('sortBy', query.sortBy)
    if (query.page) params.set('page', String(query.page))
    const res = await fetch(`${API_URL}/products?${params}`, { cache: 'no-store' })
    if (!res.ok) return undefined
    return res.json() as Promise<ProductsResponse>
  } catch {
    return undefined
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const query: Partial<ProductQueryDto> = {
    categoryId: params.categoryId,
    sortBy: (params.sortBy as ProductQueryDto['sortBy']) ?? 'newest',
    page: params.page ? Number(params.page) : 1,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  }

  const initialData = await fetchInitialProducts(query)

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="relative overflow-hidden bg-white border-b border-stone-100">
        <div className="absolute top-0 right-0 w-72 h-72 bg-green-50 rounded-full blur-3xl opacity-70 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-stone-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800 mb-2">
            Kolekcja
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-stone-900 tracking-tight italic">
            Sklep
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={null}>
          <ProductGrid initialData={initialData} initialQuery={query} />
        </Suspense>
      </div>
    </main>
  )
}
