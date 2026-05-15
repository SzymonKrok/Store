import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ImageGallery } from '@/components/products/ImageGallery'
import { ProductInfo } from '@/components/products/ProductInfo'
import type { ProductDetail } from '@/lib/api/products'

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
  const product = await fetchProduct(slug)

  if (!product) notFound()

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-10">
          <a href="/" className="hover:text-zinc-300 transition-colors">
            Strona główna
          </a>
          <span>/</span>
          <a href="/sklep" className="hover:text-zinc-300 transition-colors">
            Sklep
          </a>
          <span>/</span>
          <span className="text-zinc-400">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ImageGallery images={product.images} />
          <ProductInfo product={product} />
        </div>
      </div>
    </main>
  )
}
