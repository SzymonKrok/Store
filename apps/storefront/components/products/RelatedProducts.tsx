import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import type { ProductsResponse } from '@/lib/api/products'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchRelated(categoryId: string, excludeSlug: string) {
  try {
    const res = await fetch(`${API_URL}/products?categoryId=${categoryId}&limit=5`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data: ProductsResponse = await res.json()
    return data.items.filter((p) => p.slug !== excludeSlug).slice(0, 4)
  } catch {
    return []
  }
}

export async function RelatedProducts({
  categoryId,
  currentSlug,
}: {
  categoryId: string
  currentSlug: string
}) {
  const products = await fetchRelated(categoryId, currentSlug)
  if (products.length === 0) return null

  return (
    <AnimatedSection className="border-t border-stone-100 pt-14 pb-4">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 mb-2">
          Odkryj więcej
        </p>
        <h2 className="font-display text-3xl font-medium text-stone-900 italic tracking-tight">
          Podobne produkty
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => {
          const image = product.images[0]
          const price = Number(product.variants[0]?.price ?? product.basePrice)
          return (
            <Link key={product.id} href={`/sklep/${product.slug}`} className="group block">
              <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 transition-all duration-300 group-hover:border-stone-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                <div className="relative aspect-square overflow-hidden bg-stone-100">
                  <Image
                    src={image ? image.url : `https://picsum.photos/seed/${product.id}/400/400`}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-stone-900 font-medium text-sm leading-snug line-clamp-2 mb-1.5">
                    {product.name}
                  </h3>
                  <p className="text-stone-700 font-semibold text-base tabular-nums">
                    {price.toFixed(2)} zł
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </AnimatedSection>
  )
}

export function RelatedProductsSkeleton() {
  return (
    <div className="border-t border-stone-100 pt-14 pb-4">
      <div className="mb-8">
        <div className="h-3 w-24 bg-stone-200 rounded animate-pulse mb-3" />
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
            <div className="aspect-square bg-stone-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-stone-100 rounded w-3/4" />
              <div className="h-4 bg-stone-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
