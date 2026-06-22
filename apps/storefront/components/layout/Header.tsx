'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Menu, X, User, LogOut, Package } from 'lucide-react'
import { toast } from 'sonner'
import { CartDrawer } from './CartDrawer'
import { HeaderSearch } from './HeaderSearch'
import { useCart } from '../../lib/api/cart'
import { useAuth } from '../../lib/auth'

const navLinks = [
  { href: '/sklep', label: 'Sklep' },
  { href: '/sklep?sortBy=newest', label: 'Nowości' },
  { href: '/sklep?sortBy=price_asc', label: 'Sale' },
  { href: '/o-nas', label: 'O nas' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: cart } = useCart()
  const { user, logout } = useAuth()
  const router = useRouter()
  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  useEffect(() => {
    const handler = () => setCartOpen(true)
    window.addEventListener('cart:open', handler)
    return () => window.removeEventListener('cart:open', handler)
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  async function handleLogout() {
    setDropdownOpen(false)
    await logout()
    toast.success('Wylogowano pomyślnie')
    router.push('/')
  }

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 bg-ink/95 backdrop-blur-md border-b border-ink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" aria-label="Lune Atelier — strona główna" className="group flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-dark.jpg"
                alt="Lune Atelier"
                className="h-10 w-auto transition-opacity duration-200 group-hover:opacity-80"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[0.8rem] font-medium uppercase tracking-[0.12em] text-cream/70 hover:text-gold transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <HeaderSearch />

              {/* Auth — desktop */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setDropdownOpen((o) => !o)}
                      aria-label="Menu konta"
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cream/70 hover:text-gold hover:bg-ink-700 transition-colors rounded-xl cursor-pointer"
                    >
                      <User size={17} strokeWidth={1.5} />
                      <span className="max-w-[120px] truncate">{user.email.split('@')[0]}</span>
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-ink-800 border border-ink-600 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                        >
                          <Link
                            href="/konto"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm text-cream/80 hover:bg-ink-700 hover:text-gold transition-colors"
                          >
                            <User size={15} strokeWidth={1.5} />
                            Moje konto
                          </Link>
                          <Link
                            href="/konto/zamowienia"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm text-cream/80 hover:bg-ink-700 hover:text-gold transition-colors"
                          >
                            <Package size={15} strokeWidth={1.5} />
                            Moje zamówienia
                          </Link>
                          <div className="border-t border-ink-600 mx-2" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <LogOut size={15} strokeWidth={1.5} />
                            Wyloguj się
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href="/logowanie"
                    aria-label="Zaloguj się"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cream/70 hover:text-gold hover:bg-ink-700 transition-colors rounded-xl"
                  >
                    <User size={17} strokeWidth={1.5} />
                    Zaloguj
                  </Link>
                )}
              </div>

              <button
                onClick={() => setCartOpen(true)}
                aria-label="Otwórz koszyk"
                className="relative p-2.5 text-cream/70 hover:text-gold hover:bg-ink-700 transition-colors rounded-xl cursor-pointer"
              >
                <ShoppingBag size={19} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-gold text-ink text-[10px] font-semibold rounded-full leading-none"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </button>

              <button
                aria-label="Otwórz menu"
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2.5 text-cream/70 hover:text-gold hover:bg-ink-700 transition-colors rounded-xl cursor-pointer"
              >
                <Menu size={19} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-[100] bg-ink flex flex-col"
          >
            <div className="flex items-center justify-between h-20 px-4 border-b border-ink-600">
              <Link href="/" onClick={() => setMobileOpen(false)} aria-label="Lune Atelier — strona główna" className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-dark.jpg"
                  alt="Lune Atelier"
                  className="h-10 w-auto"
                />
              </Link>
              <button
                aria-label="Zamknij menu"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 text-cream/70 hover:text-gold hover:bg-ink-700 rounded-xl cursor-pointer"
              >
                <X size={19} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-col items-center justify-center flex-1 gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.08, duration: 0.35 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-4xl font-medium text-cream hover:text-gold transition-colors tracking-wide italic"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + navLinks.length * 0.08, duration: 0.35 }}
                className="mt-2 flex flex-col items-center gap-3"
              >
                {user ? (
                  <>
                    <Link
                      href="/konto"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-cream/70 hover:text-gold transition-colors text-sm font-medium"
                    >
                      <User size={16} strokeWidth={1.5} />
                      Moje konto
                    </Link>
                    <button
                      onClick={async () => { setMobileOpen(false); await handleLogout() }}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <LogOut size={16} strokeWidth={1.5} />
                      Wyloguj się
                    </button>
                  </>
                ) : (
                  <Link
                    href="/logowanie"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-cream/60 hover:text-gold transition-colors text-sm font-medium"
                  >
                    <User size={16} strokeWidth={1.5} />
                    Zaloguj się
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
