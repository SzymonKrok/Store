import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AnimatedSection } from '../ui/AnimatedSection'
import { ProductCard } from '../products/ProductCard'
import type { ProductSummary } from '@/lib/api/products'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchProducts(queryString: string): Promise<ProductSummary[]> {
  try {
    const res = await fetch(`${API_URL}/products?${queryString}`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

interface ProductRailProps {
  eyebrow: string
  title: string
  query?: string
  viewAllHref?: string
  className?: string
}

export async function ProductRail({
  eyebrow,
  title,
  query = 'limit=8&sortBy=newest',
  viewAllHref = '/sklep',
  className = 'bg-ink',
}: ProductRailProps) {
  const products = await fetchProducts(query)
  if (products.length === 0) return null

  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-2.5">
              {eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-cream">{title}</h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-cream/70 hover:text-gold transition-colors duration-200"
          >
            Zobacz wszystkie <ArrowRight size={14} />
          </Link>
        </AnimatedSection>

        {/* Horizontal rail on mobile, 4-up grid on desktop */}
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 grid grid-flow-col auto-cols-[68%] sm:auto-cols-[40%] md:grid-flow-row md:grid-cols-4 md:auto-cols-auto gap-4 sm:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-pl-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.slice(0, 8).map((product) => (
            <div key={product.id} className="snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-cream/80 border border-gold/40 px-6 py-3 rounded-full hover:border-gold hover:text-gold transition-colors"
          >
            Zobacz wszystkie <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
