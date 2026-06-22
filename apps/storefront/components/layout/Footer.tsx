import Link from 'next/link'

const columns = [
  {
    title: 'Sklep',
    links: [
      { href: '/sklep', label: 'Wszystkie produkty' },
      { href: '/sklep?sortBy=newest', label: 'Nowości' },
      { href: '/sklep?sortBy=price_asc', label: 'Promocje' },
    ],
  },
  {
    title: 'Informacje',
    links: [
      { href: '/o-nas', label: 'O nas' },
      { href: '/kontakt', label: 'Kontakt' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Pomoc',
    links: [
      { href: '/dostawa', label: 'Dostawa' },
      { href: '/zwroty', label: 'Zwroty' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Prawne',
    links: [
      { href: '/regulamin', label: 'Regulamin' },
      { href: '/polityka-prywatnosci', label: 'Polityka prywatności' },
      { href: '/cookies', label: 'Polityka cookies' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-ink-950 border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="Lune Atelier — strona główna" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Logo-LA.png"
                alt="Lune Atelier"
                className="h-28 w-auto"
              />
            </Link>
            <p className="mt-5 text-sm text-cream-muted leading-relaxed max-w-[200px]">
              Kobieca moda z duszą. Starannie wyselekcjonowane kolekcje, które podkreślają Twój blask.
            </p>
          </div>

          {columns.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-gold uppercase tracking-[0.2em] mb-5">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-muted hover:text-gold transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-ink-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream-muted/70">
            © {new Date().getFullYear()} Lune Atelier. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-xs text-cream-muted/70">Moda dla kobiet • Wykonane z ♥ w Polsce</p>
        </div>
      </div>
    </footer>
  )
}
