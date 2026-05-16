# Storefront UI/UX Redesign — Light Theme & Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the storefront from a dark prototype to a sophisticated, bright, premium light-mode e-commerce experience with a complete global layout (Header, Footer, homepage sections) and fluid Framer Motion animations throughout.

**Architecture:** Design tokens live in `tailwind.config.ts` + `theme.config.ts` + `globals.css` (CSS vars). A `template.tsx` file drives page transitions via Next.js App Router's re-render-on-nav semantics. All new layout components are server-compatible; only interactive pieces carry `'use client'`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS, Framer Motion, Lucide React, `next/font/google` (Inter + Cormorant)

---

## File Map

### Create
- `apps/storefront/app/template.tsx` — page transition wrapper (re-renders on every nav)
- `apps/storefront/components/layout/Header.tsx` — sticky, scroll-aware, mobile drawer
- `apps/storefront/components/layout/Footer.tsx` — 4-column light footer
- `apps/storefront/components/ui/AnimatedSection.tsx` — scroll-triggered fade-up wrapper
- `apps/storefront/components/home/HeroSection.tsx` — full-height hero with ambient blobs
- `apps/storefront/components/home/ValuePropositions.tsx` — 4 trust-signal cards
- `apps/storefront/components/home/BestsellersSection.tsx` — RSC, fetches first 4 products

### Modify
- `apps/storefront/tailwind.config.ts` — add font family vars
- `apps/storefront/app/globals.css` — CSS vars, font base styles
- `apps/storefront/theme.config.ts` — update palette + add `displayFontFamily`, `mode`
- `apps/storefront/app/layout.tsx` — load Cormorant font, add Header + Footer
- `apps/storefront/app/page.tsx` — compose Hero + ValuePropositions + BestsellersSection
- `apps/storefront/app/sklep/page.tsx` — light page shell
- `apps/storefront/app/sklep/loading.tsx` — light skeleton
- `apps/storefront/app/sklep/[slug]/page.tsx` — light breadcrumb + layout
- `apps/storefront/app/sklep/[slug]/loading.tsx` — light skeleton
- `apps/storefront/components/products/ProductCard.tsx` — stone palette
- `apps/storefront/components/products/ProductFilters.tsx` — stone palette
- `apps/storefront/components/products/ProductGrid.tsx` — stone palette
- `apps/storefront/components/products/ProductInfo.tsx` — stone palette, light CTA
- `apps/storefront/components/products/ImageGallery.tsx` — stone palette
- `apps/storefront/components/products/OmnibusPrice.tsx` — stone palette
- `apps/storefront/CLAUDE.md` *(root)* — update design system section

---

## Task 1: Design Tokens

**Files:**
- Modify: `apps/storefront/tailwind.config.ts`
- Modify: `apps/storefront/app/globals.css`
- Modify: `apps/storefront/theme.config.ts`

- [ ] **Step 1: Update `tailwind.config.ts`**

```ts
// apps/storefront/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Update `globals.css`**

```css
/* apps/storefront/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-stone-50 text-stone-900 antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  *:focus-visible {
    @apply outline-2 outline-offset-2 outline-stone-900;
  }
}
```

- [ ] **Step 3: Update `theme.config.ts`**

```ts
// apps/storefront/theme.config.ts
export const themeConfig = {
  features: {
    enableBestsellers: true,
    enableGuestCheckout: true,
    enableVariants: true,
    enableCoupons: true,
    enableAbandonedCartRecovery: true,
  },
  ui: {
    mode: 'light' as const,
    primaryColor: '#1C1917',
    accentColor: '#A16207',
    fontFamily: 'Inter',
    displayFontFamily: 'Cormorant',
    borderRadius: '1rem',
  },
  store: {
    name: 'Store',
    currency: 'PLN',
    locale: 'pl-PL',
  },
} as const

export type ThemeConfig = typeof themeConfig
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git -C /Users/szymon/Desktop/Store add \
  apps/storefront/tailwind.config.ts \
  apps/storefront/app/globals.css \
  apps/storefront/theme.config.ts
git -C /Users/szymon/Desktop/Store commit -m "feat(storefront): light theme design tokens — stone palette, Cormorant display font"
```

---

## Task 2: Page Transition + AnimatedSection

**Files:**
- Create: `apps/storefront/app/template.tsx`
- Create: `apps/storefront/components/ui/AnimatedSection.tsx`

- [ ] **Step 1: Create `app/template.tsx`**

```tsx
// apps/storefront/app/template.tsx
'use client'

import { motion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create `components/ui/AnimatedSection.tsx`**

```tsx
// apps/storefront/components/ui/AnimatedSection.tsx
'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-8%' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git -C /Users/szymon/Desktop/Store add \
  apps/storefront/app/template.tsx \
  apps/storefront/components/ui/AnimatedSection.tsx
git -C /Users/szymon/Desktop/Store commit -m "feat(storefront): page transition template + AnimatedSection scroll trigger"
```

---

## Task 3: Header

**Files:**
- Create: `apps/storefront/components/layout/Header.tsx`

- [ ] **Step 1: Create `components/layout/Header.tsx`**

```tsx
// apps/storefront/components/layout/Header.tsx
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
                <Search size={19} />
              </button>
              <button
                aria-label="Koszyk"
                className="p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl cursor-pointer"
              >
                <ShoppingBag size={19} />
              </button>
              <button
                aria-label="Otwórz menu"
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-xl cursor-pointer"
              >
                <Menu size={19} />
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
                <X size={19} />
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
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/szymon/Desktop/Store add apps/storefront/components/layout/Header.tsx
git -C /Users/szymon/Desktop/Store commit -m "feat(storefront): responsive Header with scroll-aware backdrop and mobile drawer"
```

---

## Task 4: Footer

**Files:**
- Create: `apps/storefront/components/layout/Footer.tsx`

- [ ] **Step 1: Create `components/layout/Footer.tsx`**

```tsx
// apps/storefront/components/layout/Footer.tsx
import Link from 'next/link'

const columns = [
  {
    title: 'Sklep',
    links: [
      { href: '/sklep', label: 'Wszystkie produkty' },
      { href: '/sklep?sortBy=newest', label: 'Nowości' },
      { href: '/sklep?sortBy=price_asc', label: 'Promocje' },
    ],
  },
  {
    title: 'Informacje',
    links: [
      { href: '/o-nas', label: 'O nas' },
      { href: '/kontakt', label: 'Kontakt' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Pomoc',
    links: [
      { href: '/dostawa', label: 'Dostawa' },
      { href: '/zwroty', label: 'Zwroty' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Prawne',
    links: [
      { href: '/regulamin', label: 'Regulamin' },
      { href: '/polityka-prywatnosci', label: 'Polityka prywatności' },
      { href: '/cookies', label: 'Polityka cookies' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-white border-t border-stone-200 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-display text-2xl font-medium tracking-[0.18em] text-stone-900 uppercase"
            >
              Store
            </Link>
            <p className="mt-4 text-sm text-stone-500 leading-relaxed max-w-[180px]">
              Wyjątkowe produkty dla wymagających klientów.
            </p>
          </div>

          {columns.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-[0.15em] mb-5">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-500 hover:text-stone-900 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} Store. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-xs text-stone-400">Wykonane z ♥ w Polsce</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/szymon/Desktop/Store add apps/storefront/components/layout/Footer.tsx
git -C /Users/szymon/Desktop/Store commit -m "feat(storefront): Footer with 4-column navigation and legal links"
```

---

## Task 5: Root Layout Update

**Files:**
- Modify: `apps/storefront/app/layout.tsx`

- [ ] **Step 1: Update `app/layout.tsx`**

```tsx
// apps/storefront/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Cormorant } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/providers'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Store',
  description: 'Wyjątkowe produkty dla wymagających klientów.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <Providers>
          <Header />
          <main className="pt-16">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/szymon/Desktop/Store add apps/storefront/app/layout.tsx
git -C /Users/szymon/Desktop/Store commit -m "feat(storefront): root layout wires Header, Footer, and Cormorant display font"
```

---

## Task 6: Homepage Sections

**Files:**
- Create: `apps/storefront/components/home/HeroSection.tsx`
- Create: `apps/storefront/components/home/ValuePropositions.tsx`
- Create: `apps/storefront/components/home/BestsellersSection.tsx`

- [ ] **Step 1: Create `components/home/HeroSection.tsx`**

```tsx
// apps/storefront/components/home/HeroSection.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center bg-stone-50 overflow-hidden">
      {/* Ambient background shapes */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div className="absolute top-1/4 right-[8%] w-[38vw] h-[38vw] max-w-[560px] max-h-[560px] rounded-full bg-amber-50 opacity-70 blur-3xl" />
        <div className="absolute bottom-0 left-[4%] w-[28vw] h-[28vw] max-w-[380px] max-h-[380px] rounded-full bg-stone-200 opacity-50 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 mb-6"
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
```

- [ ] **Step 2: Create `components/home/ValuePropositions.tsx`**

```tsx
// apps/storefront/components/home/ValuePropositions.tsx
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
    <section className="py-20 bg-white border-y border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {values.map((v, i) => (
            <AnimatedSection key={v.title} delay={i * 0.08}>
              <div className="flex flex-col items-center text-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-stone-100 flex items-center justify-center">
                  <v.icon size={19} className="text-stone-700" strokeWidth={1.5} />
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
```

- [ ] **Step 3: Create `components/home/BestsellersSection.tsx`**

```tsx
// apps/storefront/components/home/BestsellersSection.tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AnimatedSection } from '../ui/AnimatedSection'
import { ProductCard } from '../products/ProductCard'
import type { ProductSummary } from '@/lib/api/products'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchBestsellers(): Promise<ProductSummary[]> {
  try {
    const res = await fetch(`${API_URL}/products?limit=4&sortBy=newest`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

export async function BestsellersSection() {
  const products = await fetchBestsellers()
  if (products.length === 0) return null

  return (
    <section className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 mb-3">
              Polecane
            </p>
            <h2 className="font-display text-4xl font-medium text-stone-900">
              Bestsellery
            </h2>
          </div>
          <Link
            href="/sklep"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors duration-200"
          >
            Zobacz wszystkie <ArrowRight size={14} />
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <AnimatedSection key={product.id} delay={i * 0.07}>
              <ProductCard product={product} />
            </AnimatedSection>
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href="/sklep"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 border border-stone-300 px-6 py-3 rounded-full hover:border-stone-500 transition-colors"
          >
            Zobacz wszystkie <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git -C /Users/szymon/Desktop/Store add \
  apps/storefront/components/home/HeroSection.tsx \
  apps/storefront/components/home/ValuePropositions.tsx \
  apps/storefront/components/home/BestsellersSection.tsx
git -C /Users/szymon/Desktop/Store commit -m "feat(storefront): homepage sections — Hero, ValuePropositions, BestsellersSection"
```

---

## Task 7: Homepage page.tsx

**Files:**
- Modify: `apps/storefront/app/page.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

```tsx
// apps/storefront/app/page.tsx
import { HeroSection } from '@/components/home/HeroSection'
import { ValuePropositions } from '@/components/home/ValuePropositions'
import { BestsellersSection } from '@/components/home/BestsellersSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropositions />
      <BestsellersSection />
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/szymon/Desktop/Store add apps/storefront/app/page.tsx
git -C /Users/szymon/Desktop/Store commit -m "feat(storefront): homepage composes Hero, ValuePropositions, Bestsellers"
```

---

## Task 8: Product Components — Light Theme

**Files:**
- Modify: `apps/storefront/components/products/ProductCard.tsx`
- Modify: `apps/storefront/components/products/ProductFilters.tsx`
- Modify: `apps/storefront/components/products/ProductGrid.tsx`
- Modify: `apps/storefront/components/products/OmnibusPrice.tsx`

- [ ] **Step 1: Rewrite `ProductCard.tsx`**

```tsx
// apps/storefront/components/products/ProductCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ProductSummary } from '@/lib/api/products'

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const price = Number(product.variants[0]?.price ?? product.basePrice)
  const image = product.images[0]

  return (
    <motion.div variants={cardVariants} layout>
      <Link href={`/sklep/${product.slug}`} className="group block">
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 transition-all duration-300 group-hover:border-stone-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="relative aspect-square overflow-hidden bg-stone-100">
            {image ? (
              <Image
                src={image.url}
                alt={image.altText ?? product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-5xl text-stone-300 italic select-none">
                  S
                </span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-stone-900 font-medium text-sm leading-snug line-clamp-2 mb-1.5">
              {product.name}
            </h3>
            <p className="text-stone-700 font-semibold text-base tabular-nums">
              {price.toFixed(2)} zł
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
```

- [ ] **Step 2: Rewrite `ProductFilters.tsx`**

```tsx
// apps/storefront/components/products/ProductFilters.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { useCategories } from '@/lib/api/categories'
import type { ProductQueryDto } from '@store/validation'

interface ProductFiltersProps {
  query: Partial<ProductQueryDto>
}

export function ProductFilters({ query }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: categories } = useCategories()

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params}`)
  }

  const selectClass =
    'bg-white border border-stone-200 text-stone-700 text-sm rounded-xl px-3 py-2 hover:border-stone-400 focus:outline-none focus:border-stone-600 transition-colors cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-stone-500">
        <SlidersHorizontal size={14} strokeWidth={1.5} />
        <span className="text-xs font-semibold uppercase tracking-widest">Filtry</span>
      </div>

      <select
        value={query.categoryId ?? ''}
        onChange={(e) => updateParam('categoryId', e.target.value || undefined)}
        className={selectClass}
      >
        <option value="">Wszystkie kategorie</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        value={query.sortBy ?? 'newest'}
        onChange={(e) => updateParam('sortBy', e.target.value)}
        className={selectClass}
      >
        <option value="newest">Najnowsze</option>
        <option value="price_asc">Cena: rosnąco</option>
        <option value="price_desc">Cena: malejąco</option>
      </select>

      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min zł"
          value={query.minPrice ?? ''}
          onChange={(e) => updateParam('minPrice', e.target.value || undefined)}
          className="bg-white border border-stone-200 text-stone-700 text-sm rounded-xl px-3 py-2 w-24 hover:border-stone-400 focus:outline-none focus:border-stone-600 transition-colors"
        />
        <span className="text-stone-400 text-sm">—</span>
        <input
          type="number"
          placeholder="Max zł"
          value={query.maxPrice ?? ''}
          onChange={(e) => updateParam('maxPrice', e.target.value || undefined)}
          className="bg-white border border-stone-200 text-stone-700 text-sm rounded-xl px-3 py-2 w-24 hover:border-stone-400 focus:outline-none focus:border-stone-600 transition-colors"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `ProductGrid.tsx`**

```tsx
// apps/storefront/components/products/ProductGrid.tsx
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProducts, type ProductsResponse } from '@/lib/api/products'
import { ProductCard, cardVariants } from './ProductCard'
import { ProductFilters } from './ProductFilters'
import type { ProductQueryDto } from '@store/validation'

interface ProductGridProps {
  initialData?: ProductsResponse
  initialQuery?: Partial<ProductQueryDto>
}

export function ProductGrid({ initialData, initialQuery }: ProductGridProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const query: Partial<ProductQueryDto> = {
    categoryId: searchParams.get('categoryId') ?? initialQuery?.categoryId,
    sortBy:
      (searchParams.get('sortBy') as ProductQueryDto['sortBy']) ??
      initialQuery?.sortBy ??
      'newest',
    page: searchParams.get('page')
      ? Number(searchParams.get('page'))
      : (initialQuery?.page ?? 1),
    minPrice: searchParams.get('minPrice')
      ? Number(searchParams.get('minPrice'))
      : initialQuery?.minPrice,
    maxPrice: searchParams.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : initialQuery?.maxPrice,
  }

  const { data, isLoading } = useProducts(query, initialData)
  const currentPage = query.page ?? 1

  function setPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params}`)
  }

  return (
    <div>
      <ProductFilters query={query} />

      {isLoading ? (
        <GridSkeleton />
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-stone-400 text-base">Brak produktów spełniających kryteria.</p>
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Poprzednia strona"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-stone-500 text-sm tabular-nums">
                {currentPage} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= data.totalPages}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Następna strona"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
          <div className="aspect-square bg-stone-100" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-stone-100 rounded w-3/4" />
            <div className="h-4 bg-stone-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `OmnibusPrice.tsx`**

```tsx
// apps/storefront/components/products/OmnibusPrice.tsx
interface OmnibusPriceProps {
  currentPrice: number
  omnibusPrice: number | null | undefined
}

export function OmnibusPrice({ currentPrice, omnibusPrice }: OmnibusPriceProps) {
  if (!omnibusPrice || omnibusPrice >= currentPrice) return null

  return (
    <p className="text-stone-400 text-xs mt-1">
      Najniższa cena z 30 dni:{' '}
      <span className="text-stone-500">{omnibusPrice.toFixed(2)} zł</span>
    </p>
  )
}
```

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git -C /Users/szymon/Desktop/Store add \
  apps/storefront/components/products/ProductCard.tsx \
  apps/storefront/components/products/ProductFilters.tsx \
  apps/storefront/components/products/ProductGrid.tsx \
  apps/storefront/components/products/OmnibusPrice.tsx
git -C /Users/szymon/Desktop/Store commit -m "refactor(storefront): product grid components to light stone palette"
```

---

## Task 9: Product Detail Components — Light Theme

**Files:**
- Modify: `apps/storefront/components/products/ImageGallery.tsx`
- Modify: `apps/storefront/components/products/ProductInfo.tsx`

- [ ] **Step 1: Rewrite `ImageGallery.tsx`**

```tsx
// apps/storefront/components/products/ImageGallery.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProductImage } from '@/lib/api/products'

export function ImageGallery({ images }: { images: ProductImage[] }) {
  const [selected, setSelected] = useState(0)
  const current = images[selected]

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-stone-100 rounded-3xl flex items-center justify-center border border-stone-200">
        <span className="font-display text-7xl text-stone-300 italic select-none">S</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-stone-100 rounded-3xl overflow-hidden border border-stone-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0"
          >
            <Image
              src={current.url}
              alt={current.altText ?? ''}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(i)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors cursor-pointer ${
                i === selected
                  ? 'border-stone-900'
                  : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? ''}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `ProductInfo.tsx`**

```tsx
// apps/storefront/components/products/ProductInfo.tsx
'use client'

import { useState } from 'react'
import { ShoppingBag, Package } from 'lucide-react'
import { OmnibusPrice } from './OmnibusPrice'
import type { ProductDetail } from '@/lib/api/products'

export function ProductInfo({ product }: { product: ProductDetail }) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id ?? '')

  const selected = product.variants.find((v) => v.id === selectedId) ?? product.variants[0]
  const price = Number(selected?.price ?? product.basePrice)
  const omnibusPrice = selected?.omnibusPrice != null ? Number(selected.omnibusPrice) : null
  const inStock = (selected?.stock ?? 0) > 0
  const attributeKeys = selected ? Object.keys(selected.attributes) : []

  return (
    <div className="flex flex-col gap-5">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
        {product.category.name}
      </span>

      <h1 className="text-3xl font-semibold text-stone-900 tracking-tight leading-snug">
        {product.name}
      </h1>

      <div>
        <p className="text-2xl font-semibold text-stone-900 tabular-nums">
          {price.toFixed(2)} zł
        </p>
        <OmnibusPrice currentPrice={price} omnibusPrice={omnibusPrice} />
      </div>

      {product.description && (
        <p className="text-stone-500 text-sm leading-relaxed">{product.description}</p>
      )}

      {product.variants.length > 1 && (
        <div className="space-y-4">
          {attributeKeys.map((key) => {
            const uniqueValues = [...new Set(product.variants.map((v) => v.attributes[key]))]
            return (
              <div key={key}>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500 mb-2.5">
                  {key}
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueValues.map((val) => {
                    const matchingVariant = product.variants.find(
                      (v) => v.attributes[key] === val,
                    )
                    const isSelected = selected?.attributes[key] === val
                    const outOfStock = (matchingVariant?.stock ?? 0) === 0

                    return (
                      <button
                        key={val}
                        onClick={() => matchingVariant && setSelectedId(matchingVariant.id)}
                        disabled={outOfStock}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : outOfStock
                              ? 'border-stone-200 text-stone-300 cursor-not-allowed line-through'
                              : 'border-stone-200 text-stone-700 hover:border-stone-500'
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Package
          size={13}
          strokeWidth={1.5}
          className={inStock ? 'text-emerald-600' : 'text-red-500'}
        />
        <span className={`text-xs font-medium ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
          {inStock ? `W magazynie (${selected?.stock} szt.)` : 'Brak w magazynie'}
        </span>
      </div>

      <button
        disabled={!inStock}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-medium text-sm bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors duration-200 mt-2 cursor-pointer"
      >
        <ShoppingBag size={16} strokeWidth={1.5} />
        {inStock ? 'Dodaj do koszyka' : 'Niedostępny'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git -C /Users/szymon/Desktop/Store add \
  apps/storefront/components/products/ImageGallery.tsx \
  apps/storefront/components/products/ProductInfo.tsx
git -C /Users/szymon/Desktop/Store commit -m "refactor(storefront): product detail components to light theme"
```

---

## Task 10: Sklep Pages — Light Theme

**Files:**
- Modify: `apps/storefront/app/sklep/page.tsx`
- Modify: `apps/storefront/app/sklep/loading.tsx`
- Modify: `apps/storefront/app/sklep/[slug]/page.tsx`
- Modify: `apps/storefront/app/sklep/[slug]/loading.tsx`

- [ ] **Step 1: Update `sklep/page.tsx`**

```tsx
// apps/storefront/app/sklep/page.tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductGrid } from '@/components/products/ProductGrid'
import type { ProductsResponse } from '@/lib/api/products'
import type { ProductQueryDto } from '@store/validation'

export const metadata: Metadata = {
  title: 'Sklep | Store',
  description: 'Przeglądaj naszą kolekcję produktów',
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchInitialProducts(
  query: Partial<ProductQueryDto>,
): Promise<ProductsResponse | undefined> {
  try {
    const params = new URLSearchParams()
    if (query.categoryId) params.set('categoryId', query.categoryId)
    if (query.minPrice) params.set('minPrice', String(query.minPrice))
    if (query.maxPrice) params.set('maxPrice', String(query.maxPrice))
    if (query.sortBy) params.set('sortBy', query.sortBy)
    if (query.page) params.set('page', String(query.page))
    const res = await fetch(`${API_URL}/products?${params}`, { cache: 'no-store' })
    if (!res.ok) return undefined
    return res.json() as Promise<ProductsResponse>
  } catch {
    return undefined
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const query: Partial<ProductQueryDto> = {
    categoryId: params.categoryId,
    sortBy: (params.sortBy as ProductQueryDto['sortBy']) ?? 'newest',
    page: params.page ? Number(params.page) : 1,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  }

  const initialData = await fetchInitialProducts(query)

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-semibold text-stone-900 tracking-tight mb-8">Sklep</h1>
        <Suspense fallback={null}>
          <ProductGrid initialData={initialData} initialQuery={query} />
        </Suspense>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Update `sklep/loading.tsx`**

```tsx
// apps/storefront/app/sklep/loading.tsx
export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-9 w-24 bg-stone-200 rounded animate-pulse mb-8" />
        <div className="flex flex-wrap gap-3 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-36 bg-stone-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
              <div className="aspect-square bg-stone-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-5 bg-stone-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Update `sklep/[slug]/page.tsx`**

```tsx
// apps/storefront/app/sklep/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ImageGallery } from '@/components/products/ImageGallery'
import { ProductInfo } from '@/components/products/ProductInfo'
import type { ProductDetail } from '@/lib/api/products'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { cache: 'no-store' })
    if (res.status === 404) return null
    if (!res.ok) return null
    return res.json() as Promise<ProductDetail>
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: 'Produkt nie znaleziony | Store' }

  const image = product.images[0]
  return {
    title: `${product.name} | Store`,
    description: product.description ?? `Kup ${product.name} w naszym sklepie.`,
    openGraph: {
      title: product.name,
      description: product.description ?? `Kup ${product.name} w naszym sklepie.`,
      images: image ? [{ url: image.url, alt: image.altText ?? product.name }] : [],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) notFound()

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="flex items-center gap-2 text-xs text-stone-400 mb-10">
          <Link href="/" className="hover:text-stone-700 transition-colors">
            Strona główna
          </Link>
          <span>/</span>
          <Link href="/sklep" className="hover:text-stone-700 transition-colors">
            Sklep
          </Link>
          <span>/</span>
          <span className="text-stone-600">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ImageGallery images={product.images} />
          <ProductInfo product={product} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Update `sklep/[slug]/loading.tsx`**

```tsx
// apps/storefront/app/sklep/[slug]/loading.tsx
export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-2 mb-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-stone-200 rounded-3xl animate-pulse" />
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-20 h-20 bg-stone-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-5 pt-2">
            <div className="h-3 w-20 bg-stone-200 rounded animate-pulse" />
            <div className="h-9 w-3/4 bg-stone-200 rounded animate-pulse" />
            <div className="h-8 w-28 bg-stone-200 rounded animate-pulse" />
            <div className="space-y-2 pt-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-3 bg-stone-200 rounded animate-pulse" style={{ width: `${75 - i * 10}%` }} />
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-10 w-16 bg-stone-200 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-12 bg-stone-200 rounded-2xl animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git -C /Users/szymon/Desktop/Store add \
  "apps/storefront/app/sklep/page.tsx" \
  "apps/storefront/app/sklep/loading.tsx" \
  "apps/storefront/app/sklep/[slug]/page.tsx" \
  "apps/storefront/app/sklep/[slug]/loading.tsx"
git -C /Users/szymon/Desktop/Store commit -m "refactor(storefront): sklep pages to light theme with stone palette"
```

---

## Task 11: CLAUDE.md Update + Final Typecheck

**Files:**
- Modify: `/Users/szymon/Desktop/Store/CLAUDE.md` (UI/UX & Design System section)

- [ ] **Step 1: Update the design system section in CLAUDE.md**

Replace the `# UI/UX & DESIGN SYSTEM GUIDELINES` section with:

```markdown
# UI/UX & DESIGN SYSTEM GUIDELINES

The storefront uses a sophisticated, bright, light-mode aesthetic. Premium editorial feel — spacious, warm, and trustworthy.

## Color System (Stone + Amber)
- **Background:** `stone-50` (#FAFAF9)
- **Surfaces/Cards:** `white`
- **Borders:** `stone-200`
- **Text primary:** `stone-900`
- **Text secondary:** `stone-500`
- **Accent (gold):** `amber-700` (#A16207) — category labels, badges, hover on mobile nav
- **Destructive:** `red-600`

## Typography
- **Body/UI:** Inter (via `next/font/google`, `--font-inter`, `font-sans`)
- **Display headings:** Cormorant (via `next/font/google`, `--font-cormorant`, `font-display`) — use for `h1` hero text, section titles, logo
- **Hierarchy:** display/4xl+ → `font-display font-medium italic`; everything else → `font-sans`

## Animation Rules (Framer Motion)
- **Page transitions:** `app/template.tsx` — opacity+y, 350ms, ease smooth
- **Section reveals:** `<AnimatedSection>` (`components/ui/AnimatedSection.tsx`) — scroll-triggered, 600ms, `once: true`
- **Grid stagger:** 60ms per item via `staggerChildren`
- **Hover cards:** `group-hover:scale-105` on image, `group-hover:shadow-[...]` on card
- **Header entrance:** slide from y:-72, 500ms
- **Mobile menu:** slide from x:100%, 300ms
- Always respect `prefers-reduced-motion`

## Component Notes
- Cards: `bg-white rounded-2xl border border-stone-200` + hover shadow lift
- Buttons primary: `bg-stone-900 text-white rounded-full` or `rounded-2xl`
- Buttons ghost: `border border-stone-300 rounded-full`
- Inputs/selects: `bg-white border border-stone-200 rounded-xl`
- Header: `fixed`, transparent → `bg-white/90 backdrop-blur-md` on scroll
- No dark backgrounds on storefront (admin panel may use dark theme in Phase 5)
```

- [ ] **Step 2: Final typecheck**

```bash
pnpm --filter @store/storefront typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/szymon/Desktop/Store add CLAUDE.md
git -C /Users/szymon/Desktop/Store commit -m "docs: update design system in CLAUDE.md — light theme, stone+amber palette, Cormorant display"
```
