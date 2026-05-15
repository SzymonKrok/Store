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
      <div className="aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
        <span className="text-zinc-600 text-sm">Brak zdjęć</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
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
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                i === selected
                  ? 'border-white'
                  : 'border-zinc-700 hover:border-zinc-500'
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
