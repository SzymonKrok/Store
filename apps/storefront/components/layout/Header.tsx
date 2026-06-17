'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Search, Menu, X, User, LogOut, Package } from 'lucide-react'
import { toast } from 'sonner'
import { CartDrawer } from './CartDrawer'
import { useCart } from '../../lib/api/cart'
import { useAuth } from '../../lib/auth'

const navLinks = [
  { href: '/sklep', label: 'Sklep' },
  { href: '/o-nas', label: 'O nas' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: cart } = useCart()
  const { user, logout } = useAuth()
  const router = useRouter()
  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

              {/* Auth — desktop */}
              <div className="hidden md:block relative" ref={dropdownRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setDropdownOpen((o) => !o)}
                      aria-label="Menu konta"
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl cursor-pointer"
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
                          className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden z-50"
                        >
                          <Link
                            href="/konto"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                          >
                            <User size={15} strokeWidth={1.5} />
                            Moje konto
                          </Link>
                          <Link
                            href="/konto/zamowienia"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                          >
                            <Package size={15} strokeWidth={1.5} />
                            Moje zamówienia
                          </Link>
                          <div className="border-t border-stone-100 mx-2" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl"
                  >
                    <User size={17} strokeWidth={1.5} />
                    Zaloguj
                  </Link>
                )}
              </div>

              <button
                onClick={() => setCartOpen(true)}
                aria-label="Otwórz koszyk"
                className="relative p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl cursor-pointer"
              >
                <ShoppingBag size={19} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-amber-700 text-white text-[10px] font-medium rounded-full leading-none"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
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

            <nav className="flex flex-col items-center justify-center flex-1 gap-8">
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
                      className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium"
                    >
                      <User size={16} strokeWidth={1.5} />
                      Moje konto
                    </Link>
                    <button
                      onClick={async () => { setMobileOpen(false); await handleLogout() }}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <LogOut size={16} strokeWidth={1.5} />
                      Wyloguj się
                    </button>
                  </>
                ) : (
                  <Link
                    href="/logowanie"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm font-medium"
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
