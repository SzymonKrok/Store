'use client'

interface CartSummaryProps {
  subtotal: number
  discountAmount?: number
  couponCode?: string
}

export function CartSummary({ subtotal, discountAmount = 0, couponCode }: CartSummaryProps) {
  const total = subtotal - discountAmount

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-cream/70">
        <span>Suma częściowa</span>
        <span>{subtotal.toFixed(2)} zł</span>
      </div>
      {discountAmount > 0 && couponCode && (
        <div className="flex justify-between text-gold">
          <span>Rabat ({couponCode})</span>
          <span>−{discountAmount.toFixed(2)} zł</span>
        </div>
      )}
      <div className="flex justify-between font-semibold text-cream pt-2 border-t border-ink-600 text-base">
        <span>Razem</span>
        <span>{total.toFixed(2)} zł</span>
      </div>
    </div>
  )
}
