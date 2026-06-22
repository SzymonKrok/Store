'use client'

import { useState, useMemo } from 'react'
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
  selectedAttrs: Record<string, string>
  onSelectedAttrsChange: (attrs: Record<string, string>) => void
  attributeKeys: string[]
  showQuantitySelector?: boolean
  showStockBadge?: boolean
}

export function ProductInfo({
  product,
  selectedAttrs,
  onSelectedAttrsChange,
  attributeKeys,
  showQuantitySelector = true,
  showStockBadge = true,
}: ProductInfoProps) {
  const [qty, setQty] = useState(1)
  const [showPopup, setShowPopup] = useState(false)
  const { mutateAsync: addToCart, isPending } = useAddToCart()
  const { user } = useAuth()

  const selected = useMemo(
    () =>
      product.variants.find((v) =>
        attributeKeys.every((k) => v.attributes[k] === selectedAttrs[k]),
      ) ?? product.variants[0],
    [product.variants, attributeKeys, selectedAttrs],
  )

  const price = Number(selected?.price ?? product.basePrice)
  const compareAtPrice = selected?.compareAtPrice != null ? Number(selected.compareAtPrice) : null
  const omnibusPrice = selected?.omnibusPrice != null ? Number(selected.omnibusPrice) : null
  const inStock = (selected?.stock ?? 0) > 0

  // Empty values on either side count as wildcards so partially-filled variants still surface
  const matchesAttr = (variantVal: string | undefined, selectedVal: string | undefined) =>
    !variantVal || !selectedVal || variantVal === selectedVal

  function selectAttribute(key: string, val: string) {
    const next = { ...selectedAttrs, [key]: val }
    const exact = product.variants.find((v) =>
      attributeKeys.every((k) => v.attributes[k] === next[k]),
    )
    if (exact) {
      onSelectedAttrsChange(next)
      return
    }
    const wildcardMatch = product.variants.find(
      (v) =>
        v.attributes[key] === val &&
        attributeKeys.every((k) => k === key || matchesAttr(v.attributes[k], next[k])),
    )
    if (wildcardMatch) {
      onSelectedAttrsChange(wildcardMatch.attributes)
      return
    }
    const compatible = product.variants.filter((v) => v.attributes[key] === val)
    const best = compatible.find((v) => v.stock > 0) ?? compatible[0]
    if (best) onSelectedAttrsChange(best.attributes)
  }

  type OptionState = 'enabled' | 'out-of-stock'

  function getOptionsForKey(key: string): { val: string; state: OptionState }[] {
    const allValues = [
      ...new Set(product.variants.map((v) => v.attributes[key])),
    ].filter(Boolean)

    return allValues.map((val) => {
      // Out of stock only if no variant with this value has any stock at all
      const anyInStock = product.variants.some((v) => v.attributes[key] === val && v.stock > 0)
      return { val, state: anyInStock ? ('enabled' as const) : ('out-of-stock' as const) }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
        {product.category.name}
      </span>

      <h1 className="text-3xl font-semibold text-cream tracking-tight leading-snug">
        {product.name}
      </h1>

      <div>
        <div className="flex items-baseline gap-3">
          <p className="text-2xl font-semibold text-gold tabular-nums">
            {price.toFixed(2)} zł
          </p>
          {compareAtPrice !== null && compareAtPrice > price && (
            <p className="text-base text-cream-muted line-through tabular-nums">
              {compareAtPrice.toFixed(2)} zł
            </p>
          )}
        </div>
        <OmnibusPrice currentPrice={price} omnibusPrice={omnibusPrice} />
      </div>

      {product.shortDescription && (
        <p className="text-cream-muted text-sm leading-relaxed">{product.shortDescription}</p>
      )}

      {product.keyFeatures && product.keyFeatures.length > 0 && (
        <ul className="space-y-1.5">
          {product.keyFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-cream/80">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-gold flex-shrink-0" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {product.variants.length > 1 && attributeKeys.length > 0 && (
        <div className="space-y-4">
          {attributeKeys.map((key) => {
            const options = getOptionsForKey(key)
            return (
              <div key={key}>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cream-muted mb-2.5">
                  {key}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map(({ val, state }) => {
                    const isSelected = selectedAttrs[key] === val
                    const isOutOfStock = state === 'out-of-stock'

                    return (
                      <div key={val} className="relative group">
                        <button
                          onClick={() => selectAttribute(key, val)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? isOutOfStock
                                ? 'border-ink-500 bg-ink-700 text-cream-muted line-through'
                                : 'border-gold bg-gold text-ink'
                              : isOutOfStock
                                ? 'border-ink-600 text-cream-muted/60 line-through hover:border-ink-500'
                                : 'border-ink-600 text-cream/80 hover:border-gold'
                          }`}
                        >
                          {val}
                        </button>
                        {isOutOfStock && !isSelected && (
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1 rounded-md bg-ink-700 border border-gold/30 text-cream text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 shadow-lg"
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
            className={inStock ? 'text-emerald-400' : 'text-red-400'}
          />
          <span className={`text-xs font-medium ${inStock ? 'text-emerald-400' : 'text-red-400'}`}>
            {inStock ? `W magazynie (${selected?.stock} szt.)` : 'Brak w magazynie'}
          </span>
        </div>
      )}

      {showQuantitySelector && inStock && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-cream-muted">Ilość</span>
          <div className="flex items-center border border-ink-600 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="px-3 py-2 text-cream/80 hover:bg-ink-700 hover:text-gold disabled:text-ink-500 transition-colors cursor-pointer"
              aria-label="Zmniejsz ilość"
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-cream tabular-nums min-w-[2.5rem] text-center">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(selected?.stock ?? 99, q + 1))}
              disabled={qty >= (selected?.stock ?? 99)}
              className="px-3 py-2 text-cream/80 hover:bg-ink-700 hover:text-gold disabled:text-ink-500 transition-colors cursor-pointer"
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
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-semibold text-sm bg-gold text-ink hover:bg-gold-200 disabled:bg-ink-700 disabled:text-cream-muted disabled:cursor-not-allowed transition-colors duration-200 mt-2 cursor-pointer"
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
          variantLabel:
            attributeKeys.length > 0
              ? attributeKeys.map((k) => `${k}: ${selectedAttrs[k]}`).join(', ')
              : undefined,
        }}
      />
    </div>
  )
}
