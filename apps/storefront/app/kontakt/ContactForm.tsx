'use client'

import { useState } from 'react'

export function ContactForm() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: wire up to API / email service (Resend)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="font-display text-3xl text-cream italic mb-3">Dziękujemy!</p>
        <p className="text-sm text-cream-muted">Twoja wiadomość dotarła do nas. Odpiszemy wkrótce.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-2">
            Imię
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Anna"
            className="w-full bg-ink-700 border border-ink-600 rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream-muted/50 focus:outline-none focus:border-gold/50 transition-colors duration-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-2">
            E-mail
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="anna@example.pl"
            className="w-full bg-ink-700 border border-ink-600 rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream-muted/50 focus:outline-none focus:border-gold/50 transition-colors duration-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-2">
          Temat
        </label>
        <input
          type="text"
          name="subject"
          required
          placeholder="Pytanie dotyczące zamówienia"
          className="w-full bg-ink-700 border border-ink-600 rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream-muted/50 focus:outline-none focus:border-gold/50 transition-colors duration-200"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-2">
          Wiadomość
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Opisz swoje pytanie lub sprawę..."
          className="w-full bg-ink-700 border border-ink-600 rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream-muted/50 focus:outline-none focus:border-gold/50 transition-colors duration-200 resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gold text-ink-900 font-semibold text-sm rounded-2xl py-3.5 hover:bg-gold-300 active:bg-gold-500 transition-colors duration-200 tracking-wide"
      >
        Wyślij wiadomość
      </button>

      <p className="text-xs text-cream-muted/60 text-center leading-relaxed">
        Odpowiadamy w ciągu 1–2 dni roboczych.
      </p>
    </form>
  )
}
