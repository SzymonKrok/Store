'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import type { ProductSummary } from '@/lib/api/products'
import { useWishlist } from '@/lib/wishlist'

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const variant = product.variants[0]
  const price = Number(variant?.price ?? product.basePrice)
  const compareAt = variant?.compareAtPrice != null ? Number(variant.compareAtPrice) : null
  const onSale = compareAt !== null && compareAt > price
  const discount = onSale ? Math.round((1 - price / compareAt!) * 100) : 0

  const primary = product.images[0]
  const secondary = product.images[1]

  const { isWished, toggle } = useWishlist()
  const wished = isWished(product.id)

  function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    toggle({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: price.toFixed(2),
      imageUrl: primary?.url ?? null,
    })
  }

  return (
    <motion.div variants={cardVariants} layout>
      <Link href={`/sklep/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ink-700">
          {primary && (
            <Image
              src={primary.url}
              alt={primary.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-500 ${
                secondary ? 'group-hover:opacity-0' : 'group-hover:scale-105'
              }`}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt={secondary.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          {onSale && (
            <span className="absolute left-3 top-3 z-10 bg-gold px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-ink rounded-md">
              −{discount}%
            </span>
          )}

          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={wished ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
            aria-pressed={wished}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 backdrop-blur-sm text-cream hover:text-gold transition-colors cursor-pointer"
          >
            <Heart size={16} strokeWidth={1.5} className={wished ? 'fill-gold text-gold' : ''} />
          </button>

          <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full bg-ink/85 backdrop-blur-sm py-3 text-center text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold transition-transform duration-300 group-hover:translate-y-0">
            Zobacz produkt
          </div>
        </div>

        <div className="pt-3.5 text-center">
          {product.category?.name && (
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-cream-muted mb-1.5">
              {product.category.name}
            </p>
          )}
          <h3 className="text-cream font-medium text-sm leading-snug line-clamp-1 mb-1.5">
            {product.name}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <p className={`font-semibold text-[0.95rem] tabular-nums ${onSale ? 'text-gold' : 'text-cream'}`}>
              {price.toFixed(2)} zł
            </p>
            {onSale && (
              <p className="text-xs text-cream-muted line-through tabular-nums">
                {compareAt!.toFixed(2)} zł
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
