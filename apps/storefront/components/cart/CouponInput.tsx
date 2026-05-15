'use client'

import { useState } from 'react'
import { Tag } from 'lucide-react'
import { apiClient } from '../../lib/axios'
import { getOrCreateSessionId } from '../../lib/api/cart'

interface CouponInputProps {
  subtotal: number
  onApply: (coupon: { code: string; discountAmount: number } | null) => void
  appliedCode?: string
}

export function CouponInput({ subtotal, onApply, appliedCode }: CouponInputProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleApply() {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.post<{ discountAmount: number; finalTotal: number }>(
        '/coupons/validate',
        { code: code.trim(), subtotal },
        { headers: { 'x-cart-session': getOrCreateSessionId() } },
      )
      onApply({ code: code.trim(), discountAmount: data.discountAmount })
      setCode('')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nieprawidłowy kod kuponu')
      onApply(null)
    } finally {
      setLoading(false)
    }
  }

  function handleRemove() {
    onApply(null)
    setCode('')
    setError(null)
  }

  if (appliedCode) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Tag size={13} strokeWidth={1.5} className="text-green-700 flex-shrink-0" />
        <span className="text-sm text-green-700 font-medium flex-1">{appliedCode}</span>
        <button
          onClick={handleRemove}
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          Usuń
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Kod kuponu"
          className="flex-1 h-9 px-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 bg-white placeholder:text-stone-400"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="h-9 px-4 text-sm font-medium bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? '...' : 'Zastosuj'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
