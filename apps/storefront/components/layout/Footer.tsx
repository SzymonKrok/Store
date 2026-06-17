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
    <footer className="bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-display text-2xl font-medium tracking-[0.18em] text-amber-200 uppercase italic"
            >
              Store
            </Link>
            <p className="mt-4 text-sm text-stone-400 leading-relaxed max-w-[180px]">
              Wyjątkowe produkty z naturalnego drewna, tworzone z pasją i rzemiosłem.
            </p>
          </div>

          {columns.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-amber-400/70 uppercase tracking-[0.2em] mb-5">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-400 hover:text-stone-100 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} Store. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-xs text-stone-500">Wykonane z ♥ w Polsce</p>
        </div>
      </div>
    </footer>
  )
}
