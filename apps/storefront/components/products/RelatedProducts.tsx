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
    <AnimatedSection className="border-t border-ink-600 pt-14 pb-4">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-2">
          Odkryj więcej
        </p>
        <h2 className="font-display text-3xl font-medium text-cream italic tracking-tight">
          Podobne produkty
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => {
          const image = product.images[0]
          const price = Number(product.variants[0]?.price ?? product.basePrice)
          return (
            <Link key={product.id} href={`/sklep/${product.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ink-700">
                {image && (
                  <Image
                    src={image.url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="pt-3.5 text-center">
                <h3 className="text-cream font-medium text-sm leading-snug line-clamp-1 mb-1.5">
                  {product.name}
                </h3>
                <p className="text-gold font-semibold text-[0.95rem] tabular-nums">
                  {price.toFixed(2)} zł
                </p>
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
    <div className="border-t border-ink-600 pt-14 pb-4">
      <div className="mb-8">
        <div className="h-3 w-24 bg-ink-600 rounded animate-pulse mb-3" />
        <div className="h-8 w-48 bg-ink-600 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-ink-700 rounded-xl" />
            <div className="pt-3.5 space-y-2 flex flex-col items-center">
              <div className="h-3.5 bg-ink-700 rounded w-3/4" />
              <div className="h-4 bg-ink-700 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
