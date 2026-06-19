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
      <div className="mt-2 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
        <CheckCircle size={16} strokeWidth={1.5} className="text-amber-700 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800 leading-relaxed">
          Dzięki! Damy znać na <span className="font-medium">{email}</span>, gdy ten produkt wróci do sprzedaży.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2.5">
      <div className="flex items-center gap-2 text-sm font-medium text-stone-800">
        <Bell size={15} strokeWidth={1.5} className="text-amber-700" />
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
          className="flex-1 h-10 px-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-amber-600 bg-white transition-colors placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-4 bg-amber-800 text-white text-sm font-medium rounded-xl hover:bg-amber-900 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {isPending ? 'Zapisuję…' : 'Zapisz mnie'}
        </button>
      </form>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
