import type { MetadataRoute } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

interface SlugItem {
  slug: string
  updatedAt?: string
}

interface ProductsResponse {
  items: SlugItem[]
  totalPages: number
}

async function fetchAllProducts(): Promise<SlugItem[]> {
  const items: SlugItem[] = []
  let page = 1

  try {
    while (true) {
      const res = await fetch(`${API_URL}/products?page=${page}&limit=100`, {
        cache: 'no-store',
      })
      if (!res.ok) break

      const data: ProductsResponse = await res.json()
      items.push(...data.items)

      if (page >= data.totalPages) break
      page++
    }
  } catch {
    // Return whatever was collected before the error
  }

  return items
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchAllProducts()

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/sklep/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/sklep`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productEntries,
  ]
}
