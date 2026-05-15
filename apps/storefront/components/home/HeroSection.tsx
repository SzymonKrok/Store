'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center bg-stone-50 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div className="absolute top-1/4 right-[8%] w-[38vw] h-[38vw] max-w-[560px] max-h-[560px] rounded-full bg-green-50 opacity-70 blur-3xl" />
        <div className="absolute bottom-0 left-[4%] w-[28vw] h-[28vw] max-w-[380px] max-h-[380px] rounded-full bg-stone-200 opacity-50 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-green-800 mb-6"
          >
            Nowa kolekcja 2026
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium text-stone-900 leading-[1.05] tracking-tight"
          >
            Rzeczy, które
            <br />
            <span className="italic text-stone-500">mają znaczenie.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-lg text-stone-500 leading-relaxed max-w-md"
          >
            Starannie wyselekcjonowane produkty dla osób, które cenią jakość ponad wszystko.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/sklep"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-stone-700 transition-colors duration-200 cursor-pointer"
            >
              Przeglądaj kolekcję
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/o-nas"
              className="inline-flex items-center gap-2 text-stone-700 text-sm font-medium border border-stone-300 px-8 py-3.5 rounded-full hover:border-stone-600 hover:text-stone-900 transition-colors duration-200 cursor-pointer"
            >
              Nasza historia
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative w-full aspect-[4/5] max-w-md rounded-3xl bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden flex items-center justify-center shadow-[0_24px_80px_rgba(0,0,0,0.07)]">
            <span className="font-display text-[9rem] text-stone-300 font-light italic select-none">
              S
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
