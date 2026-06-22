'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  imageUrl: string | null
}

const ITEMS_PER_PAGE = 4

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

function CategoryCard({ cat }: { cat: Category }) {
  return (
    <Link
      href={`/sklep?categoryId=${cat.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ink-800 border border-ink-700"
    >
      {cat.imageUrl && (
        <Image
          src={cat.imageUrl}
          alt={cat.name}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/10 transition-colors duration-300 group-hover:from-ink/95" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-medium text-cream italic">{cat.name}</h3>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
            <ArrowUpRight size={15} strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1)

  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE)
  const pageItems = categories.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

  function goTo(next: number, dir: number) {
    setDirection(dir)
    setPage(next)
  }

  function handleNext() {
    goTo((page + 1) % totalPages, 1)
  }

  function handlePrev() {
    goTo((page - 1 + totalPages) % totalPages, -1)
  }

  // Static grid — no carousel needed
  if (totalPages <= 1) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
      </div>
    )
  }

  return (
    <div>
      {/* Slide */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {pageItems.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center gap-6">
        {/* Prev */}
        <button
          onClick={handlePrev}
          aria-label="Poprzednia strona"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-600 text-cream/60 hover:border-gold hover:text-gold transition-colors duration-200 cursor-pointer"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > page ? 1 : -1)}
              aria-label={`Strona ${i + 1}`}
              className="cursor-pointer transition-all duration-300"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === page
                    ? 'w-6 h-1.5 bg-gold'
                    : 'w-1.5 h-1.5 bg-ink-500 hover:bg-cream/40'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={handleNext}
          aria-label="Następna strona"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-600 text-cream/60 hover:border-gold hover:text-gold transition-colors duration-200 cursor-pointer"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
