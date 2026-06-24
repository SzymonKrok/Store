import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// Bezpieczny default: dopóki NEXT_PUBLIC_ALLOW_INDEXING !== 'true' (np. staging),
// blokujemy całość przed robotami. Na produkcji ustaw flagę = 'true'.
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
