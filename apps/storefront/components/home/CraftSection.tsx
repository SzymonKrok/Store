import { AnimatedSection } from '../ui/AnimatedSection'

const stats = [
  { value: '10+', label: 'lat tworzenia kobiecej mody' },
  { value: '100%', label: 'starannie wyselekcjonowane materiały' },
  { value: '5000+', label: 'zadowolonych klientek' },
]

export function CraftSection() {
  return (
    <section className="py-28 bg-ink-950 text-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-6">
              Nasza filozofia
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.08] text-cream">
              Każda kobieta
              <br />
              <span className="italic text-gold-200">jest wyjątkowa</span>
            </h2>
            <p className="mt-7 text-cream-muted leading-relaxed max-w-sm text-[0.95rem]">
              Tworzymy kolekcje, które celebrują kobiecość w każdej jej odsłonie. Ponadczasowe kroje, szlachetne tkaniny i dbałość o detal — moda, w której poczujesz się sobą.
            </p>

            <div className="mt-10 w-16 h-px bg-gold" />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-0 divide-y divide-ink-600">
            {stats.map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.12}>
                <div className="py-8 flex items-start gap-6">
                  <p className="font-display text-4xl text-gold font-medium w-24 shrink-0 leading-none">
                    {stat.value}
                  </p>
                  <p className="text-sm text-cream-muted leading-relaxed pt-1">
                    {stat.label}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
