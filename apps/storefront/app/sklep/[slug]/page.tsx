import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductDetailLayout } from '@/components/products/ProductDetailLayout'
import { ProductDescription } from '@/components/products/ProductDescription'
import { ProductViewTracker } from '@/components/products/ProductViewTracker'
import { RelatedProducts, RelatedProductsSkeleton } from '@/components/products/RelatedProducts'
import { ReviewsSection } from '@/components/products/ReviewsSection'
import type { ProductDetail } from '@/lib/api/products'
import { fetchStoreSettingsServer } from '@/lib/api/settings'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { cache: 'no-store' })
    if (res.status === 404) return null
    if (!res.ok) return null
    return res.json() as Promise<ProductDetail>
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: 'Produkt nie znaleziony | Lune Atelier' }

  const image = product.images[0]
  return {
    title: `${product.name} | Lune Atelier`,
    description: product.description ?? `Kup ${product.name} w naszym sklepie.`,
    openGraph: {
      title: product.name,
      description: product.description ?? `Kup ${product.name} w naszym sklepie.`,
      images: image ? [{ url: image.url, alt: image.altText ?? product.name }] : [],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [product, settings] = await Promise.all([fetchProduct(slug), fetchStoreSettingsServer()])
  if (!product) notFound()

  return (
    <main className="min-h-screen bg-ink">
      {/* Dark breadcrumb strip — consistent with shop hero */}
      <div className="bg-ink-950 border-b border-ink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs text-cream-muted">
            <Link href="/" className="hover:text-gold transition-colors">
              Strona główna
            </Link>
            <span className="text-ink-500">/</span>
            <Link href="/sklep" className="hover:text-gold transition-colors">
              Sklep
            </Link>
            <span className="text-ink-500">/</span>
            <span className="text-cream/80 truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductViewTracker slug={slug} />
        <ProductDetailLayout
          product={product}
          showQuantitySelector={settings.showQuantitySelector}
          showStockBadge={settings.showStockBadge}
        />

        <ProductDescription
          description={product.description}
          specifications={product.specifications}
        />

        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts
            categoryId={product.category.id}
            currentSlug={slug}
          />
        </Suspense>

        {settings.showReviews && <ReviewsSection productId={product.id} />}
      </div>
    </main>
  )
}
