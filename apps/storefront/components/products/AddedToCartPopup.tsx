'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ShoppingBag, ArrowRight } from 'lucide-react'

interface AddedToCartPopupProps {
  isOpen: boolean
  onClose: () => void
  product: {
    name: string
    imageUrl?: string
    price: number
    variantLabel?: string
  }
}

export function AddedToCartPopup({ isOpen, onClose, product }: AddedToCartPopupProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      timerRef.current = setTimeout(onClose, 16000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isOpen, onClose])

  function openCart() {
    window.dispatchEvent(new CustomEvent('cart:open'))
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-label="Dodano do koszyka"
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-20 right-4 sm:right-6 z-[80] w-[calc(100vw-2rem)] sm:w-[360px] bg-ink-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-ink-600 overflow-hidden"
        >
          {/* Auto-dismiss progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 16, ease: 'linear' }}
            style={{ originX: 0 }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gold"
          />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Check size={13} strokeWidth={2.5} className="text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-cream">Dodano do koszyka</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="p-1.5 text-cream-muted hover:text-cream hover:bg-ink-700 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>

          {/* Product row */}
          <div className="flex items-center gap-3.5 px-5 pb-4 border-b border-ink-600">
            <div className="w-16 h-16 rounded-xl bg-ink-700 overflow-hidden flex-shrink-0">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
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
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cream leading-snug line-clamp-2">
                {product.name}
              </p>
              {product.variantLabel && (
                <p className="text-xs text-cream-muted mt-0.5">{product.variantLabel}</p>
              )}
              <p className="text-sm font-semibold text-gold tabular-nums mt-1">
                {product.price.toFixed(2)} zł
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 space-y-2.5">
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gold text-ink text-sm font-semibold rounded-xl hover:bg-gold-200 transition-colors cursor-pointer"
            >
              Przejdź do kasy
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={openCart}
                className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-sm font-medium text-cream/80 border border-ink-600 rounded-xl hover:border-gold/50 hover:text-gold transition-colors cursor-pointer"
              >
                <ShoppingBag size={14} strokeWidth={1.5} />
                Zobacz koszyk
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                Kontynuuj zakupy
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
