import Image from 'next/image'
import Link from 'next/link'
import { AnimatedSection } from '../ui/AnimatedSection'

const panels = [
  {
    eyebrow: 'Nowa kolekcja',
    title: 'Wieczorowa elegancja',
    desc: 'Sukienki, które zostaną zapamiętane.',
    href: '/sklep?sortBy=newest',
    cta: 'Odkryj',
    image: '/promo-wieczorowa.jpg',
  },
  {
    eyebrow: 'Must have',
    title: 'Codzienna klasyka',
    desc: 'Ponadczasowe kroje na każdy dzień.',
    href: '/sklep',
    cta: 'Zobacz',
    image: '/promo-codzienna.jpg',
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
                {/* Background photo */}
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient overlay so text stays readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/10" />

                {/* Text content — anchored to bottom */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-10">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-gold mb-2">
                    {p.eyebrow}
                  </p>
                  <h3 className="font-display text-3xl sm:text-4xl font-medium text-cream leading-tight mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-cream/70 leading-relaxed mb-5 max-w-xs">{p.desc}</p>
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
