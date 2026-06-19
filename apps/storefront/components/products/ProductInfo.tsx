'use client'

import { useState } from 'react'
import { ShoppingBag, Package, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { OmnibusPrice } from './OmnibusPrice'
import { AddedToCartPopup } from './AddedToCartPopup'
import { NotifyMeForm } from './NotifyMeForm'
import { useAddToCart } from '@/lib/api/cart'
import { useAuth } from '@/lib/auth'
import type { ProductDetail } from '@/lib/api/products'

interface ProductInfoProps {
  product: ProductDetail
  showQuantitySelector?: boolean
  showStockBadge?: boolean
}

export function ProductInfo({ product, showQuantitySelector = true, showStockBadge = true }: ProductInfoProps) {
  const [selectedId, setSelectedId] = useState(product.variants[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [showPopup, setShowPopup] = useState(false)
  const { mutateAsync: addToCart, isPending } = useAddToCart()
  const { user } = useAuth()

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
                      <div key={val} className="relative group">
                        <button
                          onClick={() => matchingVariant && setSelectedId(matchingVariant.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? outOfStock
                                ? 'border-stone-400 bg-stone-100 text-stone-500 line-through'
                                : 'border-amber-800 bg-amber-800 text-white'
                              : outOfStock
                                ? 'border-stone-200 text-stone-400 line-through hover:border-stone-400'
                                : 'border-stone-200 text-stone-700 hover:border-amber-600'
                          }`}
                        >
                          {val}
                        </button>
                        {outOfStock && !isSelected && (
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 rounded-md bg-stone-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 shadow-lg"
                          >
                            Brak — kliknij, aby otrzymać powiadomienie
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showStockBadge && (
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
      )}

      {showQuantitySelector && inStock && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">Ilość</span>
          <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="px-3 py-2 text-stone-600 hover:bg-stone-100 disabled:text-stone-300 transition-colors cursor-pointer"
              aria-label="Zmniejsz ilość"
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-stone-900 tabular-nums min-w-[2.5rem] text-center">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(selected?.stock ?? 99, q + 1))}
              disabled={qty >= (selected?.stock ?? 99)}
              className="px-3 py-2 text-stone-600 hover:bg-stone-100 disabled:text-stone-300 transition-colors cursor-pointer"
              aria-label="Zwiększ ilość"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {inStock ? (
        <button
          disabled={isPending}
          onClick={async () => {
            if (!selected) return
            try {
              await addToCart({ variantId: selected.id, quantity: qty })
              setShowPopup(true)
            } catch (err: unknown) {
              const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
              toast.error(Array.isArray(msg) ? msg.join(', ') : (msg as string) ?? 'Nie udało się dodać do koszyka')
            }
          }}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-medium text-sm bg-amber-800 text-white hover:bg-amber-900 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors duration-200 mt-2 cursor-pointer"
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
          {isPending ? 'Dodawanie…' : 'Dodaj do koszyka'}
        </button>
      ) : selected ? (
        <NotifyMeForm
          key={selected.id}
          variantId={selected.id}
          defaultEmail={user?.email}
        />
      ) : null}

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
