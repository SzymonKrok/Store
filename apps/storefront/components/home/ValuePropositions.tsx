import { Truck, RotateCcw, Shield, Headphones } from 'lucide-react'
import { AnimatedSection } from '../ui/AnimatedSection'

const values = [
  { icon: Truck, title: 'Darmowa dostawa', desc: 'Od zamówień powyżej 200 zł' },
  { icon: RotateCcw, title: 'Bezpłatne zwroty', desc: 'Do 30 dni od zakupu' },
  { icon: Shield, title: 'Bezpieczna płatność', desc: 'SSL + Przelewy24' },
  { icon: Headphones, title: 'Wsparcie 24/7', desc: 'Zawsze do Twojej dyspozycji' },
]

export function ValuePropositions() {
  return (
    <section className="py-20 bg-amber-950/[0.04] border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {values.map((v, i) => (
            <AnimatedSection key={v.title} delay={i * 0.08}>
              <div className="flex flex-col items-center text-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <v.icon size={19} className="text-amber-800" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 tracking-wide leading-snug">
                  {v.title}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">{v.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
