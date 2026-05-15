'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Search, Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/sklep', label: 'Sklep' },
  { href: '/o-nas', label: 'O nas' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="font-display text-2xl font-medium tracking-[0.18em] text-stone-900 uppercase"
            >
              Store
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors duration-200 tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <button
                aria-label="Szukaj"
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl cursor-pointer"
              >
                <Search size={19} strokeWidth={1.5} />
              </button>
              <button
                aria-label="Koszyk"
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl cursor-pointer"
              >
                <ShoppingBag size={19} strokeWidth={1.5} />
              </button>
              <button
                aria-label="Otwórz menu"
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl cursor-pointer"
              >
                <Menu size={19} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-stone-100">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="font-display text-2xl font-medium tracking-[0.18em] text-stone-900 uppercase"
              >
                Store
              </Link>
              <button
                aria-label="Zamknij menu"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                <X size={19} strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex flex-col items-center justify-center flex-1 gap-10">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.08, duration: 0.35 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-4xl font-medium text-stone-900 hover:text-amber-700 transition-colors tracking-wide italic"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
