import type { Metadata } from 'next'
import { Inter, Cormorant } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/providers'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { CookieBanner } from '../components/CookieBanner'
import { TrackingScripts } from '../components/TrackingScripts'
import { fetchStoreSettingsServer } from '../lib/api/settings'

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

export const metadata: Metadata = {
  title: 'Store',
  description: 'Wyjątkowe produkty dla wymagających klientów.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchStoreSettingsServer()

  return (
    <html lang="pl">
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <TrackingScripts ga4Id={settings.ga4Id} fbPixelId={settings.fbPixelId} />
        <Providers>
          <Header />
          <main className="pt-16">{children}</main>
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
