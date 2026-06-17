'use client'

import { useState } from 'react'
import { ShoppingBag, Package } from 'lucide-react'
import { toast } from 'sonner'
import { OmnibusPrice } from './OmnibusPrice'
import { AddedToCartPopup } from './AddedToCartPopup'
import { useAddToCart } from '@/lib/api/cart'
import type { ProductDetail } from '@/lib/api/products'

export function ProductInfo({ product }: { product: ProductDetail }) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id ?? '')
  const [showPopup, setShowPopup] = useState(false)
  const { mutateAsync: addToCart, isPending } = useAddToCart()

  const selected = product.variants.find((v) => v.id === selectedId) ?? product.variants[0]
  const price = Number(selected?.price ?? product.basePrice)
  const compareAtPrice = selected?.compareAtPrice != null ? Number(selected.compareAtPrice) : null
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
        <div className="flex items-baseline gap-3">
          <p className="text-2xl font-semibold text-amber-800 tabular-nums">
            {price.toFixed(2)} zł
          </p>
          {compareAtPrice !== null && compareAtPrice > price && (
            <p className="text-base text-stone-400 line-through tabular-nums">
              {compareAtPrice.toFixed(2)} zł
            </p>
          )}
        </div>
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
                            ? 'border-amber-800 bg-amber-800 text-white'
                            : outOfStock
                              ? 'border-stone-200 text-stone-300 cursor-not-allowed line-through'
                              : 'border-stone-200 text-stone-700 hover:border-amber-600'
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
        disabled={!inStock || isPending}
        onClick={async () => {
          if (!selected) return
          try {
            await addToCart({ variantId: selected.id, quantity: 1 })
            setShowPopup(true)
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg as string) ?? 'Nie udało się dodać do koszyka')
          }
        }}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-medium text-sm bg-amber-800 text-white hover:bg-amber-900 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors duration-200 mt-2 cursor-pointer"
      >
        <ShoppingBag size={16} strokeWidth={1.5} />
        {inStock ? (isPending ? 'Dodawanie…' : 'Dodaj do koszyka') : 'Niedostępny'}
      </button>

      <AddedToCartPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        product={{
          name: product.name,
          imageUrl: product.images[0]?.url,
          price,
          variantLabel: attributeKeys.length > 0
            ? attributeKeys.map((k) => `${k}: ${selected?.attributes[k]}`).join(', ')
            : undefined,
        }}
      />
    </div>
  )
}
