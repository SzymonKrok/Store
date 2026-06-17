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
  const placeholderSrc = `https://picsum.photos/seed/${product.id}/600/600`

  return (
    <motion.div variants={cardVariants} layout>
      <Link href={`/sklep/${product.slug}`} className="group block">
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 transition-all duration-300 group-hover:border-amber-200 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)]">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-stone-100">
            <Image
              src={image ? image.url : placeholderSrc}
              alt={image ? (image.altText ?? product.name) : product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Warm amber overlay on hover */}
            <div className="absolute inset-0 bg-amber-900/0 group-hover:bg-amber-900/[0.04] transition-colors duration-300" />
          </div>

          {/* Info */}
          <div className="p-4 pb-5">
            {product.category?.name && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 mb-1.5">
                {product.category.name}
              </p>
            )}
            <h3 className="text-stone-900 font-medium text-sm leading-snug line-clamp-2 mb-2.5">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-amber-800 font-semibold text-base tabular-nums">
                {price.toFixed(2)} zł
              </p>
              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Zobacz →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
