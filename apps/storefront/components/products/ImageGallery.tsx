'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProductImage } from '@/lib/api/products'

export function ImageGallery({
  images,
  productName,
}: {
  images: ProductImage[]
  productName: string
}) {
  const [selected, setSelected] = useState(0)
  const current = images[selected]

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-ink-700 rounded-3xl flex items-center justify-center border border-ink-600">
        <span className="font-display text-7xl text-gold/40 italic select-none">L</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-ink-700 rounded-3xl overflow-hidden border border-ink-600">
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
              alt={current.altText ?? productName}
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
                  ? 'border-gold'
                  : 'border-ink-600 hover:border-gold/50'
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productName} — zdjęcie ${i + 1}`}
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
