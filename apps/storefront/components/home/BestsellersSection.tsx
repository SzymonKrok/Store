import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AnimatedSection } from '../ui/AnimatedSection'
import { ProductCard } from '../products/ProductCard'
import type { ProductSummary } from '@/lib/api/products'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchBestsellers(): Promise<ProductSummary[]> {
  try {
    const res = await fetch(`${API_URL}/products?limit=4&sortBy=newest`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

export async function BestsellersSection() {
  const products = await fetchBestsellers()
  if (products.length === 0) return null

  return (
    <section className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-800 mb-3">
              Polecane
            </p>
            <h2 className="font-display text-4xl font-medium text-stone-900">
              Bestsellery
            </h2>
          </div>
          <Link
            href="/sklep"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors duration-200"
          >
            Zobacz wszystkie <ArrowRight size={14} />
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <AnimatedSection key={product.id} delay={i * 0.07}>
              <ProductCard product={product} />
            </AnimatedSection>
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href="/sklep"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 border border-stone-300 px-6 py-3 rounded-full hover:border-stone-500 transition-colors"
          >
            Zobacz wszystkie <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
