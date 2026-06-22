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

  const selectClass =
    'bg-ink-800 border border-ink-600 text-cream text-sm rounded-xl px-3 py-2 hover:border-gold/50 focus:outline-none focus:border-gold transition-colors cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-gold">
        <SlidersHorizontal size={14} strokeWidth={1.5} />
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">Filtry</span>
      </div>

      <select
        value={query.categoryId ?? ''}
        onChange={(e) => updateParam('categoryId', e.target.value || undefined)}
        className={selectClass}
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
        className={selectClass}
      >
        <option value="newest">Najnowsze</option>
        <option value="bestseller">Bestsellery</option>
        <option value="price_asc">Cena: rosnąco</option>
        <option value="price_desc">Cena: malejąco</option>
      </select>

      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min zł"
          value={query.minPrice ?? ''}
          onChange={(e) => updateParam('minPrice', e.target.value || undefined)}
          className="bg-ink-800 border border-ink-600 text-cream text-sm rounded-xl px-3 py-2 w-24 placeholder:text-cream-muted/60 hover:border-gold/50 focus:outline-none focus:border-gold transition-colors"
        />
        <span className="text-cream-muted text-sm">—</span>
        <input
          type="number"
          placeholder="Max zł"
          value={query.maxPrice ?? ''}
          onChange={(e) => updateParam('maxPrice', e.target.value || undefined)}
          className="bg-ink-800 border border-ink-600 text-cream text-sm rounded-xl px-3 py-2 w-24 placeholder:text-cream-muted/60 hover:border-gold/50 focus:outline-none focus:border-gold transition-colors"
        />
      </div>
    </div>
  )
}
