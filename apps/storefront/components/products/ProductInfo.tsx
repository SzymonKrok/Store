'use client'

import { useState } from 'react'
import { ShoppingCart, Package } from 'lucide-react'
import { OmnibusPrice } from './OmnibusPrice'
import type { ProductDetail } from '@/lib/api/products'

export function ProductInfo({ product }: { product: ProductDetail }) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id ?? '')

  const selected = product.variants.find((v) => v.id === selectedId) ?? product.variants[0]
  const price = Number(selected?.price ?? product.basePrice)
  const omnibusPrice = selected?.omnibusPrice != null ? Number(selected.omnibusPrice) : null
  const inStock = (selected?.stock ?? 0) > 0

  const attributeKeys = selected
    ? Object.keys(selected.attributes)
    : []

  return (
    <div className="flex flex-col gap-5">
      {/* Category */}
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
        {product.category.name}
      </span>

      {/* Name */}
      <h1 className="text-3xl font-bold text-white tracking-tight leading-snug">
        {product.name}
      </h1>

      {/* Price */}
      <div>
        <p className="text-2xl font-semibold text-white">{price.toFixed(2)} zł</p>
        <OmnibusPrice currentPrice={price} omnibusPrice={omnibusPrice} />
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-zinc-400 text-sm leading-relaxed">{product.description}</p>
      )}

      {/* Variant selector — only if more than one variant */}
      {product.variants.length > 1 && (
        <div className="space-y-3">
          {attributeKeys.map((key) => {
            const uniqueValues = [...new Set(product.variants.map((v) => v.attributes[key]))]
            return (
              <div key={key}>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{key}</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueValues.map((val) => {
                    const matchingVariant = product.variants.find(
                      (v) => v.attributes[key] === val,
                    )
                    const isSelected =
                      matchingVariant?.id === selectedId ||
                      (selected?.attributes[key] === val)
                    const outOfStock = (matchingVariant?.stock ?? 0) === 0

                    return (
                      <button
                        key={val}
                        onClick={() => matchingVariant && setSelectedId(matchingVariant.id)}
                        disabled={outOfStock}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                          isSelected
                            ? 'border-white text-white bg-zinc-800'
                            : outOfStock
                              ? 'border-zinc-800 text-zinc-600 cursor-not-allowed line-through'
                              : 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
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

      {/* Stock status */}
      <div className="flex items-center gap-2">
        <Package size={14} className={inStock ? 'text-emerald-500' : 'text-red-500'} />
        <span className={`text-xs ${inStock ? 'text-emerald-500' : 'text-red-500'}`}>
          {inStock ? `Dostępne (${selected?.stock} szt.)` : 'Brak w magazynie'}
        </span>
      </div>

      {/* Add to cart — placeholder for Phase 3 */}
      <button
        disabled={!inStock}
        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-semibold text-sm bg-white text-zinc-950 hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors mt-2"
      >
        <ShoppingCart size={17} />
        {inStock ? 'Dodaj do koszyka' : 'Niedostępny'}
      </button>
    </div>
  )
}
