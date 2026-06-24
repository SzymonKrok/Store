import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart, Sparkles, Award } from 'lucide-react'
import { AnimatedSection } from '@/components/ui/AnimatedSection'

export const metadata: Metadata = {
  title: 'O nas',
  description: 'Poznaj historię Lune Atelier — butiku kobiecej mody z pasją do elegancji i jakości.',
  alternates: { canonical: '/o-nas' },
}

const stats = [
  { value: '10+', label: 'lat tworzenia kobiecej mody' },
  { value: '5 000+', label: 'zadowolonych klientek' },
  { value: '100%', label: 'starannie dobrane kolekcje' },
]

const values = [
  {
    icon: Heart,
    title: 'Kobiecość',
    description:
      'Wierzymy, że każda kobieta jest wyjątkowa. Nasze kolekcje celebrują kobiecość w każdej jej odsłonie — od klasycznej elegancji po nowoczesną swobodę.',
  },
  {
    icon: Award,
    title: 'Jakość',
    description:
      'Każdy produkt przechodzi staranny proces selekcji. Dobieramy wyłącznie tkaniny i kroje, które są trwałe, wygodne i ponadczasowe.',
  },
  {
    icon: Sparkles,
    title: 'Styl',
    description:
      'Moda to opowieść. Pomagamy ją tworzyć — ze smakiem, dbałością o detal i poczuciem, że w tym co nosisz, czujesz się najlepiej.',
  },
]

const team = [
  {
    name: 'Imię Nazwisko',
    role: 'Założycielka & Dyrektor Kreatywna',
    bio: 'Pasjonatka mody z wieloletnim doświadczeniem w branży. Lune Atelier to jej spełnienie marzeń — przestrzeń, gdzie elegancja spotyka się z kobiecością.',
  },
  {
    name: 'Imię Nazwisko',
    role: 'Stylistka',
    bio: 'Odpowiada za dobór kolekcji i inspiracje sezonowe. Wierzy, że dobry strój potrafi zmienić nastrój na cały dzień.',
  },
]

export default function AboutPage() {
  return (
    <div className="bg-ink text-cream">

      {/* Hero */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ink-800/40 to-ink" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-4">
              Nasza historia
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium text-cream leading-[1.05] tracking-tight mb-6">
              Moda z pasją,
              <br />
              <span className="italic text-gold-200">stworzona dla kobiet</span>
            </h1>
            <p className="text-cream/60 max-w-xl mx-auto leading-relaxed">
              Lune Atelier powstało z przekonania, że dobra moda to nie luksus — to codzienność.
              Jesteśmy butikowym sklepem, w którym każdy wybór jest przemyślany i kobiecy.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            <AnimatedSection>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                <Image
                  src="/about-story.jpg"
                  alt="Lune Atelier — nasza historia"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                  priority
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-5">
                Skąd się wzięłyśmy
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-medium leading-[1.08] mb-7">
                Od pomysłu<br />
                <span className="italic text-gold-200">do Twojej szafy</span>
              </h2>
              <div className="space-y-4 text-cream-muted leading-relaxed text-[0.95rem]">
                <p>
                  Lune Atelier to efekt lat obserwowania kobiet i ich relacji z modą. Widziałyśmy,
                  jak trudno znaleźć ubrania, które są jednocześnie eleganckie, wygodne
                  i dostępne — bez konieczności wydawania fortuny.
                </p>
                <p>
                  Postanowiłyśmy to zmienić. Każda kolekcja, którą wybieramy, przechodzi przez
                  filtr jednego prostego pytania: czy sama chciałabym to nosić? Jeśli odpowiedź
                  brzmi "tak" — trafia do sklepu.
                </p>
                <p>
                  Dziś Lune Atelier to tysiące klientek, które nam zaufały, i setki stylizacji,
                  które pomogłyśmy stworzyć. To nasza największa nagroda.
                </p>
              </div>
              <div className="mt-10 w-16 h-px bg-gold" />
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-ink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink-600">
            {stats.map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.1} className="py-10 sm:py-6 sm:px-10 text-center">
                <p className="font-display text-5xl text-gold font-medium mb-2">{stat.value}</p>
                <p className="text-sm text-cream-muted leading-relaxed">{stat.label}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-3">
              Co nas wyróżnia
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-medium">
              Nasze <span className="italic text-gold-200">wartości</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, description }, i) => (
              <AnimatedSection key={title} delay={i * 0.1}>
                <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 h-full">
                  <div className="w-10 h-10 rounded-xl bg-ink-700 border border-ink-600 flex items-center justify-center mb-6">
                    <Icon size={17} strokeWidth={1.5} className="text-gold" />
                  </div>
                  <h3 className="font-display text-2xl text-cream italic mb-3">{title}</h3>
                  <p className="text-sm text-cream-muted leading-relaxed">{description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-3">
              Poznaj nas
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-medium">
              Nasz <span className="italic text-gold-200">zespół</span>
            </h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {team.map((member, i) => (
              <AnimatedSection key={member.name} delay={i * 0.12}>
                <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
                  {/* Placeholder photo — replace with actual */}
                  <div className="aspect-square bg-ink-700 border-b border-ink-600 flex items-center justify-center">
                    <p className="font-display text-6xl text-ink-500 italic select-none">
                      {member.name.charAt(0)}
                    </p>
                  </div>
                  <div className="p-6">
                    <p className="font-semibold text-cream text-sm">{member.name}</p>
                    <p className="text-xs text-gold uppercase tracking-[0.15em] mt-0.5 mb-3">
                      {member.role}
                    </p>
                    <p className="text-sm text-cream-muted leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink-950 border-t border-ink-600">
        <AnimatedSection className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-4">
            Zapraszamy
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium mb-5">
            Odkryj naszą<br />
            <span className="italic text-gold-200">kolekcję</span>
          </h2>
          <p className="text-cream-muted text-sm leading-relaxed mb-10 max-w-md mx-auto">
            Każdy produkt wybrany z myślą o Tobie. Przekonaj się sama.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sklep"
              className="inline-flex items-center gap-2 bg-gold text-ink-900 px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-gold-300 transition-colors duration-200"
            >
              Przejdź do sklepu
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 border border-gold/40 text-cream/80 px-8 py-3.5 rounded-full text-sm font-medium hover:border-gold hover:text-gold transition-all duration-200"
            >
              Napisz do nas
            </Link>
          </div>
        </AnimatedSection>
      </section>

    </div>
  )
}
