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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-semibold text-stone-900 tracking-tight mb-8">Sklep</h1>
        <Suspense fallback={null}>
          <ProductGrid initialData={initialData} initialQuery={query} />
        </Suspense>
      </div>
    </main>
  )
}
