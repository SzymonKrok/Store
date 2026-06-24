import type { Metadata } from 'next'
import { Inter, Cormorant } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/providers'
import { AnnouncementBar } from '../components/layout/AnnouncementBar'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { CookieBanner } from '../components/CookieBanner'
import { TrackingScripts } from '../components/TrackingScripts'
import { fetchStoreSettingsServer } from '../lib/api/settings'
import { JsonLd } from '../components/JsonLd'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, organizationJsonLd, websiteJsonLd } from '../lib/seo'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

// Domyślnie strona jest UKRYTA przed wyszukiwarkami (bezpieczny default dla stagingu).
// Indeksowanie włącza się dopiero po ustawieniu NEXT_PUBLIC_ALLOW_INDEXING=true (produkcja).
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Moda damska`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  robots: allowIndexing ? undefined : { index: false, follow: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Moda damska`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Moda damska`,
    description: SITE_DESCRIPTION,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchStoreSettingsServer()

  return (
    <html lang="pl">
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <TrackingScripts ga4Id={settings.ga4Id} fbPixelId={settings.fbPixelId} />
        <Providers>
          <AnnouncementBar />
          <Header />
          <main>{children}</main>
          <Footer />
          <CookieBanner />
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
