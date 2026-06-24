import { themeConfig } from '@/theme.config'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luneatelier.pl').replace(
  /\/$/,
  '',
)

export const SITE_NAME = themeConfig.store.name
export const SITE_DESCRIPTION = themeConfig.seo.description
export const SITE_CURRENCY = themeConfig.store.currency
export const SITE_LOCALE = themeConfig.store.locale

/** Zamienia ścieżkę względną na pełny URL bezwzględny (wymagany przez schema.org / OpenGraph). */
export function absoluteUrl(path = ''): string {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Organization — tożsamość marki w Google (logo, kontakt, social). Cała witryna. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/LA-logo-transparent.png'),
    sameAs: themeConfig.seo.social,
  }
}

/** WebSite — pozwala Google rozpoznać witrynę (i ewentualny sitelinks searchbox). */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'pl-PL',
  }
}

interface ProductLike {
  name: string
  slug: string
  description?: string | null
  shortDescription?: string | null
  basePrice: number
  images: { url: string; altText?: string | null }[]
  variants: { sku: string; price: number; stock: number }[]
  category: { name: string }
}

/** Product — cena, dostępność, marka. Daje szansę na rich snippet (cena w wynikach). */
export function productJsonLd(product: ProductLike) {
  const prices = product.variants.map((v) => v.price)
  const lowPrice = prices.length ? Math.min(...prices) : product.basePrice
  const highPrice = prices.length ? Math.max(...prices) : product.basePrice
  const inStock = product.variants.some((v) => v.stock > 0)
  const description =
    product.description ?? product.shortDescription ?? `${product.name} — ${SITE_NAME}.`

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: product.images.map((img) => absoluteUrl(img.url)),
    sku: product.variants[0]?.sku,
    category: product.category.name,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: SITE_CURRENCY,
      lowPrice,
      highPrice,
      offerCount: product.variants.length || 1,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/sklep/${product.slug}`),
    },
  }
}

/** BreadcrumbList — okruszki w wynikach Google (Strona główna › Sklep › Produkt). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
