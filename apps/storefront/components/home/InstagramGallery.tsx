import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { AnimatedSection } from '../ui/AnimatedSection'

const HANDLE = '@luneatelier'
const photos = [
  { src: '/instagram1.jpg', alt: 'Czarny komplet – koszula i szorty' },
  { src: '/instagram2.jpg', alt: 'Biały top koronkowy z jeansową spódnicą' },
  { src: '/instagram3.jpg', alt: 'Beżowy komplet z falbanami' },
  { src: '/instagram4.jpg', alt: 'Biała koszulka z jeansową spódnicą' },
  { src: '/instagram5.jpg', alt: 'Biały gorset z jeansową spódnicą' },
  { src: '/instagram6.jpg', alt: 'Czerwony komplet sportowy' },
]

export function InstagramGallery() {
  return (
    <section className="py-24 bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-3">
            Instagram
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium text-cream mb-3">
            Obserwuj nas
          </h2>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-cream/70 hover:text-gold transition-colors"
          >
            <Instagram size={16} strokeWidth={1.5} />
            {HANDLE}
          </a>
        </AnimatedSection>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {photos.map((photo, i) => (
            <AnimatedSection key={photo.src} delay={i * 0.05}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label={`${HANDLE} na Instagramie`}
                className="group relative block aspect-square overflow-hidden rounded-xl"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/60 transition-colors duration-300">
                  <Instagram
                    size={22}
                    strokeWidth={1.5}
                    className="text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              </a>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
