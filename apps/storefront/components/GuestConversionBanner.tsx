'use client'

import { useState } from 'react'
import { CheckCircle, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '../lib/axios'
import { useAuth } from '../lib/auth'

interface Props {
  orderId: string
}

export function GuestConversionBanner({ orderId }: Props) {
  const { refreshProfile } = useAuth()
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  if (done) {
    return (
      <div className="flex items-start gap-3 bg-gold/10 border border-gold/30 rounded-2xl px-5 py-4 text-sm text-cream/90">
        <CheckCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />
        <p>
          Konto zostało utworzone. Możesz teraz śledzić zamówienia w zakładce{' '}
          <a href="/konto/zamowienia" className="font-medium text-gold underline hover:no-underline">
            Moje zamówienia
          </a>
          .
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Hasło musi mieć co najmniej 8 znaków')
      return
    }
    setIsSubmitting(true)
    try {
      const { data } = await apiClient.post<{ accessToken: string }>('/auth/convert-guest', {
        orderId,
        password,
      })
      localStorage.setItem('storefront_token', data.accessToken)
      await refreshProfile()
      setDone(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (status === 409 && msg?.includes('log in')) {
        setAlreadyRegistered(true)
      } else {
        toast.error(msg ?? 'Nie udało się utworzyć konta. Spróbuj ponownie.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (alreadyRegistered) {
    return (
      <div className="bg-ink-800 border border-ink-600 rounded-2xl px-5 py-4 text-sm text-cream/80">
        Ten adres email jest już zarejestrowany.{' '}
        <a
          href={`/logowanie?redirect=/order-confirmation/${orderId}`}
          className="font-medium text-gold underline hover:no-underline"
        >
          Zaloguj się
        </a>
        , aby przypisać zamówienie do konta.
      </div>
    )
  }

  return (
    <div className="bg-ink-800 border border-ink-600 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <UserPlus size={15} strokeWidth={1.5} className="text-gold" />
        </div>
        <div>
          <p className="font-medium text-cream text-sm">Chcesz łatwo śledzić swoje zamówienia?</p>
          <p className="text-cream-muted text-xs mt-0.5">
            Ustaw hasło, a utworzymy dla Ciebie konto — bez żadnych dodatkowych danych.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 znaków"
          autoComplete="new-password"
          className="flex-1 h-10 px-3 text-sm border border-ink-600 rounded-xl focus:outline-none focus:border-gold bg-ink-700 text-cream placeholder:text-cream-muted/60 transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-4 bg-gold text-ink text-sm font-semibold rounded-xl hover:bg-gold-200 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {isSubmitting ? 'Tworzenie…' : 'Utwórz konto'}
        </button>
      </form>
    </div>
  )
}
