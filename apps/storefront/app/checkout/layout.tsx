import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Zamówienie | Lune Atelier',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="h-20 border-b border-ink-600 bg-ink-950 flex items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Lune Atelier — strona główna" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/LA-logo-horizonal.png"
            alt="Lune Atelier"
            className="h-10 w-auto"
          />
        </Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
