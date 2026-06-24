'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-7.25rem)] flex items-center overflow-hidden bg-ink">
      {/* Video background — poster (lekki JPG) renderuje się natychmiast jako LCP,
          wideo dociąga się w tle i zaczyna grać gdy gotowe. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster="/hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-banner.mp4" type="video/mp4" />
      </video>

      {/* Overlay: darken video so text stays legible */}
      <div className="absolute inset-0 bg-ink/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-ink/30" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl">
          {/* Animated line + label */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="block w-8 h-px bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Fashion for Women
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-medium text-cream leading-[1.0] tracking-tight"
          >
            Moda, która
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="italic text-gold-200"
            >
              podkreśla Twój blask.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-6 text-base sm:text-lg text-cream/60 leading-relaxed max-w-md"
          >
            Starannie wyselekcjonowane kolekcje dla kobiet, które cenią elegancję i jakość. Każda stylizacja to opowieść o pewności siebie i kobiecości.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/sklep"
              className="inline-flex items-center gap-2 bg-gold text-ink px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-gold-200 transition-colors duration-200"
            >
              Odkryj kolekcję
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/sklep"
              className="inline-flex items-center gap-2 text-cream/80 text-sm font-medium border border-gold/40 px-8 py-3.5 rounded-full hover:border-gold hover:text-gold transition-all duration-200"
            >
              Nasza historia
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gold/50"
      >
        <span className="text-[10px] uppercase tracking-[0.25em]">Przewiń</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  )
}
