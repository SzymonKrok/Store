import type { Metadata } from 'next'
import { Mail, Phone, MapPin, Instagram, Facebook, Clock } from 'lucide-react'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Kontakt | Lune Atelier',
  description: 'Skontaktuj się z nami. Jesteśmy tu, by pomóc.',
}

const contactDetails = [
  {
    icon: Mail,
    label: 'E-mail',
    value: 'kontakt@luneatelier.pl',
    href: 'mailto:kontakt@luneatelier.pl',
  },
  {
    icon: Phone,
    label: 'Telefon',
    value: '+48 000 000 000',
    href: 'tel:+48000000000',
  },
  {
    icon: MapPin,
    label: 'Adres',
    value: 'ul. Przykładowa 1, 00-000 Warszawa',
    href: null,
  },
  {
    icon: Clock,
    label: 'Godziny obsługi',
    value: 'Pn–Pt, 9:00–17:00',
    href: null,
  },
]

const socialLinks = [
  {
    icon: Instagram,
    label: 'Instagram',
    handle: '@luneatelier',
    href: 'https://instagram.com/luneatelier',
  },
  {
    icon: Facebook,
    label: 'Facebook',
    handle: 'Lune Atelier',
    href: 'https://facebook.com/luneatelier',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-ink pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <AnimatedSection className="mb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-3">
            Lune Atelier
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-medium text-cream italic mb-4">
            Kontakt
          </h1>
          <p className="text-cream-muted max-w-md mx-auto text-sm leading-relaxed">
            Masz pytanie dotyczące zamówienia, rozmiaru lub produktu? Chętnie pomożemy.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Contact info */}
          <AnimatedSection>
            <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 h-full">
              <h2 className="font-display text-2xl text-cream italic mb-7">
                Dane kontaktowe
              </h2>

              <ul className="space-y-6">
                {contactDetails.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-4">
                    <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl bg-ink-700 border border-ink-600 flex items-center justify-center">
                      <Icon size={15} strokeWidth={1.5} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-0.5">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="text-sm text-cream hover:text-gold transition-colors duration-200"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm text-cream">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Social media */}
              <div className="mt-10 pt-8 border-t border-ink-600">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-5">
                  Social media
                </p>
                <div className="flex flex-col gap-4">
                  {socialLinks.map(({ icon: Icon, label, handle, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-ink-700 border border-ink-600 flex items-center justify-center group-hover:border-gold/40 transition-colors duration-200">
                        <Icon size={15} strokeWidth={1.5} className="text-gold" />
                      </div>
                      <div>
                        <p className="text-xs text-cream-muted">{label}</p>
                        <p className="text-sm text-cream group-hover:text-gold transition-colors duration-200">
                          {handle}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Contact form */}
          <AnimatedSection>
            <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 h-full">
              <h2 className="font-display text-2xl text-cream italic mb-7">
                Napisz do nas
              </h2>
              <ContactForm />
            </div>
          </AnimatedSection>

        </div>
      </div>
    </div>
  )
}
