'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag } from 'lucide-react'
import { useCart } from '../../lib/api/cart'
import { CartItem } from '../cart/CartItem'
import { CouponInput } from '../cart/CouponInput'
import { CartSummary } from '../cart/CartSummary'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { data: cart, isLoading } = useCart()
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null)

  const items = cart?.items ?? []
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.variant.price) * i.quantity, 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-stone-900/30 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Koszyk"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-0 right-0 bottom-0 z-[95] w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={17} strokeWidth={1.5} className="text-stone-700" />
                <span className="font-medium text-stone-900 text-sm tracking-wide">
                  Koszyk{itemCount > 0 ? ` (${itemCount})` : ''}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Zamknij koszyk"
                className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
                  <ShoppingBag size={28} strokeWidth={1} className="text-stone-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-stone-900 mb-1.5">Koszyk jest pusty</p>
                  <p className="text-stone-400 text-sm leading-relaxed">
                    Dodaj produkty, aby&nbsp;kontynuować zakupy
                  </p>
                </div>
                <Link
                  href="/sklep"
                  onClick={onClose}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  Przeglądaj sklep
                </Link>
              </div>
            ) : (
              <>
                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-5">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-5 py-4 border-t border-stone-100 space-y-4">
                  <CouponInput
                    subtotal={subtotal}
                    onApply={setAppliedCoupon}
                    appliedCode={appliedCoupon?.code}
                  />
                  <CartSummary
                    subtotal={subtotal}
                    discountAmount={appliedCoupon?.discountAmount}
                    couponCode={appliedCoupon?.code}
                  />
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="block w-full text-center py-3 bg-stone-900 text-white text-sm font-medium rounded-2xl hover:bg-stone-700 transition-colors cursor-pointer"
                  >
                    Przejdź do kasy
                  </Link>
                  <button
                    onClick={onClose}
                    className="block w-full text-center py-2 text-sm text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    Kontynuuj zakupy
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
