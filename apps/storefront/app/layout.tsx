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

export const metadata: Metadata = {
  title: 'Lune Atelier — Moda damska',
  description: 'Lune Atelier — kobieca moda z duszą. Starannie wyselekcjonowane kolekcje, które podkreślają Twój blask.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchStoreSettingsServer()

  return (
    <html lang="pl">
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
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
