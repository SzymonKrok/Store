import { AnimatedSection } from '../ui/AnimatedSection'

const stats = [
  { value: '15+', label: 'lat doświadczenia w rzemiośle' },
  { value: '100%', label: 'naturalne drewno z certyfikowanych źródeł' },
  { value: '500+', label: 'zadowolonych klientów' },
]

export function CraftSection() {
  return (
    <section className="py-28 bg-stone-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400 mb-6">
              Nasze rzemiosło
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.08] text-white">
              Każdy kawałek
              <br />
              <span className="italic text-stone-400">jest unikalny</span>
            </h2>
            <p className="mt-7 text-stone-400 leading-relaxed max-w-sm text-[0.95rem]">
              Tworzymy przedmioty z naturalnego drewna, które odzwierciedlają charakter i piękno surowca. Słoje, sęki i nieregularności to nie wady — to historia drzewa zapisana przez lata.
            </p>

            <div className="mt-10 w-16 h-px bg-amber-700" />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-0 divide-y divide-stone-800">
            {stats.map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.12}>
                <div className="py-8 flex items-start gap-6">
                  <p className="font-display text-4xl text-amber-300 font-medium w-24 shrink-0 leading-none">
                    {stat.value}
                  </p>
                  <p className="text-sm text-stone-500 leading-relaxed pt-1">
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
