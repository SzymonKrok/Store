'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Video — slow Ken Burns zoom-out for a cinematic pull */}
      <motion.video
        autoPlay
        muted
        loop
        playsInline
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'linear' }}
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero.mp4"
      />

      {/* Layered overlays: left-side reading contrast + bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

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
            <span className="block w-8 h-px bg-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Rzemiosło z pasją
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-medium text-white leading-[1.0] tracking-tight"
          >
            Drewno, które
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="italic text-amber-200"
            >
              opowiada historię.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-6 text-base sm:text-lg text-white/65 leading-relaxed max-w-md"
          >
            Ręcznie tworzone meble i przedmioty z drewna. Każdy projekt to unikalna historia naturalnego materiału i mistrzowskiego rzemiosła.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/sklep"
              className="inline-flex items-center gap-2 bg-white text-stone-900 px-8 py-3.5 rounded-full text-sm font-medium hover:bg-amber-50 transition-colors duration-200"
            >
              Odkryj kolekcję
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/sklep"
              className="inline-flex items-center gap-2 text-white/80 text-sm font-medium border border-white/30 px-8 py-3.5 rounded-full hover:border-white/70 hover:text-white transition-all duration-200"
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
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
