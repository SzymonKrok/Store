'use client'

import Image from 'next/image'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useUpdateCartItem, useRemoveCartItem } from '../../lib/api/cart'
import type { CartItem as CartItemType } from '../../lib/api/cart'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { mutate: updateQuantity, isPending: isUpdating } = useUpdateCartItem()
  const { mutate: removeItem, isPending: isRemoving } = useRemoveCartItem()

  const price = parseFloat(item.variant.price)
  const image = item.variant.product.images[0]
  const attrs = Object.entries(item.variant.attributes)

  return (
    <div className="flex gap-3 py-4 border-b border-ink-600 last:border-0">
      <div className="w-16 h-16 rounded-xl bg-ink-700 overflow-hidden flex-shrink-0">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? item.variant.product.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-2xl italic text-gold/40">
            L
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream leading-tight truncate">
          {item.variant.product.name}
        </p>
        {attrs.length > 0 && (
          <p className="text-xs text-cream-muted mt-0.5">
            {attrs.map(([k, v]) => `${k}: ${v}`).join(', ')}
          </p>
        )}
        <p className="text-sm font-medium text-gold mt-1">
          {(price * item.quantity).toFixed(2)} zł
        </p>

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border border-ink-600 rounded-xl overflow-hidden">
            <button
              onClick={() =>
                item.quantity > 1
                  ? updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })
                  : removeItem(item.id)
              }
              disabled={isUpdating || isRemoving}
              className="w-7 h-7 flex items-center justify-center text-cream-muted hover:text-gold hover:bg-ink-700 transition-colors disabled:opacity-40 cursor-pointer"
              aria-label="Zmniejsz ilość"
            >
              <Minus size={12} strokeWidth={2} />
            </button>
            <span className="w-7 h-7 flex items-center justify-center text-xs font-medium text-cream">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
              disabled={isUpdating || isRemoving}
              className="w-7 h-7 flex items-center justify-center text-cream-muted hover:text-gold hover:bg-ink-700 transition-colors disabled:opacity-40 cursor-pointer"
              aria-label="Zwiększ ilość"
            >
              <Plus size={12} strokeWidth={2} />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            disabled={isRemoving}
            className="p-1.5 text-cream-muted hover:text-red-400 transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Usuń z koszyka"
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
