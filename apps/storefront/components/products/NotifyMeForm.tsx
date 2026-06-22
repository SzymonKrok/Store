'use client'

import { useState } from 'react'
import { Bell, CheckCircle } from 'lucide-react'
import { useSubscribeStockNotification } from '../../lib/api/stock-notifications'

interface NotifyMeFormProps {
  variantId: string
  defaultEmail?: string
}

export function NotifyMeForm({ variantId, defaultEmail }: NotifyMeFormProps) {
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useSubscribeStockNotification()

  // Reset success state when variant changes (parent unmounts/remounts via key, but be safe)
  function reset() {
    setDone(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    reset()
    if (!email.trim()) {
      setError('Podaj swój adres email')
      return
    }
    try {
      await mutateAsync({ variantId, email: email.trim() })
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg as string) ?? 'Nie udało się zapisać. Spróbuj ponownie.')
    }
  }

  if (done) {
    return (
      <div className="mt-2 flex items-start gap-2.5 p-3.5 bg-gold/10 border border-gold/30 rounded-2xl">
        <CheckCircle size={16} strokeWidth={1.5} className="text-gold mt-0.5 shrink-0" />
        <p className="text-sm text-cream/90 leading-relaxed">
          Dzięki! Damy znać na <span className="font-medium text-gold">{email}</span>, gdy ten produkt wróci do sprzedaży.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2 p-3.5 bg-ink-800 border border-ink-600 rounded-2xl space-y-2.5">
      <div className="flex items-center gap-2 text-sm font-medium text-cream">
        <Bell size={15} strokeWidth={1.5} className="text-gold" />
        Powiadom mnie, gdy będzie dostępny
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@email.pl"
          autoComplete="email"
          required
          className="flex-1 h-10 px-3 text-sm border border-ink-600 rounded-xl focus:outline-none focus:border-gold bg-ink-700 text-cream transition-colors placeholder:text-cream-muted/60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-4 bg-gold text-ink text-sm font-semibold rounded-xl hover:bg-gold-200 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {isPending ? 'Zapisuję…' : 'Zapisz mnie'}
        </button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
