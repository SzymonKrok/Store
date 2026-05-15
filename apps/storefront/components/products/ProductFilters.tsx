'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { useCategories } from '@/lib/api/categories'
import type { ProductQueryDto } from '@store/validation'

interface ProductFiltersProps {
  query: Partial<ProductQueryDto>
}

export function ProductFilters({ query }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { data: categories } = useCategories()

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-zinc-500">
        <SlidersHorizontal size={15} />
        <span className="text-sm font-medium">Filtry</span>
      </div>

      <select
        value={query.categoryId ?? ''}
        onChange={(e) => updateParam('categoryId', e.target.value || undefined)}
        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 hover:border-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
      >
        <option value="">Wszystkie kategorie</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        value={query.sortBy ?? 'newest'}
        onChange={(e) => updateParam('sortBy', e.target.value)}
        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 hover:border-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
      >
        <option value="newest">Najnowsze</option>
        <option value="price_asc">Cena: rosnąco</option>
        <option value="price_desc">Cena: malejąco</option>
      </select>

      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min zł"
          value={query.minPrice ?? ''}
          onChange={(e) => updateParam('minPrice', e.target.value || undefined)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 w-24 hover:border-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
        />
        <span className="text-zinc-600 text-sm">—</span>
        <input
          type="number"
          placeholder="Max zł"
          value={query.maxPrice ?? ''}
          onChange={(e) => updateParam('maxPrice', e.target.value || undefined)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 w-24 hover:border-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
        />
      </div>
    </div>
  )
}
