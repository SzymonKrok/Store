import Link from 'next/link'
import { AnimatedSection } from '../ui/AnimatedSection'

const panels = [
  {
    eyebrow: 'Nowa kolekcja',
    title: 'Wieczorowa elegancja',
    desc: 'Sukienki, które zostaną zapamiętane.',
    href: '/sklep?sortBy=newest',
    cta: 'Odkryj',
  },
  {
    eyebrow: 'Must have',
    title: 'Codzienna klasyka',
    desc: 'Ponadczasowe kroje na każdy dzień.',
    href: '/sklep',
    cta: 'Zobacz',
  },
]

export function PromoBanner() {
  return (
    <section className="py-20 bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {panels.map((p, i) => (
            <AnimatedSection key={p.title} delay={i * 0.1}>
              <Link
                href={p.href}
                className="group relative block aspect-[16/10] md:aspect-[3/4] lg:aspect-[16/10] overflow-hidden rounded-2xl bg-ink-800 border border-ink-700"
              >
                <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12 max-w-md">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-gold mb-3">
                    {p.eyebrow}
                  </p>
                  <h3 className="font-display text-3xl sm:text-4xl font-medium text-cream leading-tight mb-3">
                    {p.title}
                  </h3>
                  <p className="text-sm text-cream/70 leading-relaxed mb-6 max-w-xs">{p.desc}</p>
                  <span className="inline-flex w-fit items-center gap-2 bg-gold text-ink text-sm font-semibold px-6 py-3 rounded-full transition-colors group-hover:bg-gold-200">
                    {p.cta}
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
