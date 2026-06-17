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
      <div className="flex justify-between text-stone-600">
        <span>Suma częściowa</span>
        <span>{subtotal.toFixed(2)} zł</span>
      </div>
      {discountAmount > 0 && couponCode && (
        <div className="flex justify-between text-amber-700">
          <span>Rabat ({couponCode})</span>
          <span>−{discountAmount.toFixed(2)} zł</span>
        </div>
      )}
      <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-100 text-base">
        <span>Razem</span>
        <span>{total.toFixed(2)} zł</span>
      </div>
    </div>
  )
}
