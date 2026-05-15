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
        <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 transition-all duration-300 group-hover:border-stone-300 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="relative aspect-square overflow-hidden bg-stone-100">
            <Image
              src={image ? image.url : placeholderSrc}
              alt={image ? (image.altText ?? product.name) : product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
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
