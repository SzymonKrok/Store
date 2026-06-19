import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ImageGallery } from '@/components/products/ImageGallery'
import { ProductInfo } from '@/components/products/ProductInfo'
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
  if (!product) return { title: 'Produkt nie znaleziony | Store' }

  const image = product.images[0]
  return {
    title: `${product.name} | Store`,
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
    <main className="min-h-screen bg-stone-50">
      {/* Dark breadcrumb strip — consistent with shop hero */}
      <div className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-xs text-stone-500">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              Strona główna
            </Link>
            <span className="text-stone-700">/</span>
            <Link href="/sklep" className="hover:text-amber-400 transition-colors">
              Sklep
            </Link>
            <span className="text-stone-700">/</span>
            <span className="text-stone-300 truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductViewTracker slug={slug} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ImageGallery images={product.images} />
          <ProductInfo
            product={product}
            showQuantitySelector={settings.showQuantitySelector}
            showStockBadge={settings.showStockBadge}
          />
        </div>

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
