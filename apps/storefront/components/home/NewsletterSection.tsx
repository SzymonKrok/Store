'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'

export function NewsletterSection() {
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    toast.success('Dziękujemy! Kod rabatowy −10% jest w drodze na Twój e-mail.')
    setEmail('')
  }

  return (
    <section className="py-24 bg-ink-950 border-y border-gold/20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 mb-6">
          <Mail size={20} strokeWidth={1.5} className="text-gold" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-3">
          Newsletter
        </p>
        <h2 className="font-display text-4xl sm:text-5xl font-medium text-cream mb-4">
          Dołącz do <span className="italic text-gold-200">Lune Atelier</span>
        </h2>
        <p className="text-cream-muted text-sm leading-relaxed max-w-md mx-auto mb-8">
          Zapisz się do newslettera i odbierz <span className="text-gold font-medium">−10%</span> na
          pierwsze zakupy. Jako pierwsza poznasz nowe kolekcje i ekskluzywne oferty.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Twój adres e-mail"
            autoComplete="email"
            aria-label="Adres e-mail"
            className="flex-1 h-12 px-4 text-sm bg-ink-800 border border-ink-600 rounded-xl text-cream placeholder:text-cream-muted/60 focus:outline-none focus:border-gold transition-colors"
          />
          <button
            type="submit"
            className="h-12 px-7 bg-gold text-ink text-sm font-semibold rounded-xl hover:bg-gold-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Zapisz się
          </button>
        </form>
        <p className="text-[0.7rem] text-cream-muted/70 mt-4">
          Zapisując się, akceptujesz naszą Politykę prywatności. Możesz zrezygnować w każdej chwili.
        </p>
      </div>
    </section>
  )
}
