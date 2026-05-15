import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Zamówienie | Store',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="h-16 border-b border-stone-200 bg-white flex items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-[0.18em] text-stone-900 uppercase"
        >
          Store
        </Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
