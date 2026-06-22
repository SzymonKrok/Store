import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductGrid } from '@/components/products/ProductGrid'
import type { ProductsResponse } from '@/lib/api/products'
import type { ProductQueryDto } from '@store/validation'

export const metadata: Metadata = {
  title: 'Sklep | Lune Atelier',
  description: 'Przeglądaj naszą kolekcję kobiecej mody',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchInitialProducts(
  query: Partial<ProductQueryDto>,
): Promise<ProductsResponse | undefined> {
  try {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
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
    q: params.q,
    categoryId: params.categoryId,
    sortBy: (params.sortBy as ProductQueryDto['sortBy']) ?? 'newest',
    page: params.page ? Number(params.page) : 1,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  }

  const initialData = await fetchInitialProducts(query)

  return (
    <main className="min-h-screen bg-ink">
      {/* Dark hero banner — same language as CraftSection & HeroSection */}
      <div className="relative overflow-hidden bg-ink-950">
        {/* Ambient gold glow */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-gold/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold/5 rounded-full blur-[100px] translate-x-[-30%] translate-y-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-8 h-px bg-gold" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Kolekcja
            </p>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium text-cream leading-[1.05]">
            Nasza
            <br />
            <span className="italic text-gold-200">kolekcja</span>
          </h1>

          <p className="mt-7 text-cream-muted text-[0.95rem] leading-relaxed max-w-sm">
            Starannie wyselekcjonowane stylizacje dla kobiet, które cenią elegancję — każdy element
            tworzony z myślą o ponadczasowej kobiecości.
          </p>

          <div className="mt-10 w-16 h-px bg-gold" />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={null}>
          <ProductGrid initialData={initialData} initialQuery={query} />
        </Suspense>
      </div>
    </main>
  )
}
