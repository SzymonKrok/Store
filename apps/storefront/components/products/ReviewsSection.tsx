'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare, Check } from 'lucide-react'

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="flex gap-1" role="group" aria-label="Ocena">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} ${n === 1 ? 'gwiazdka' : n < 5 ? 'gwiazdki' : 'gwiazdek'}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="p-0.5 transition-transform duration-150 hover:scale-110 cursor-pointer"
        >
          <Star
            size={28}
            strokeWidth={1.5}
            className={
              n <= active
                ? 'text-amber-400 fill-amber-400'
                : 'text-stone-300 fill-stone-100'
            }
          />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          className={
            n <= value
              ? 'text-amber-400 fill-amber-400'
              : 'text-stone-200 fill-stone-100'
          }
        />
      ))}
    </div>
  )
}

interface ReviewsSectionProps {
  productId: string
}

export function ReviewsSection({ productId: _ }: ReviewsSectionProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormOpen(false)
      setRating(0)
      setName('')
      setComment('')
    }, 2500)
  }

  return (
    <section className="border-t border-stone-100 py-14" aria-labelledby="reviews-heading">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800 mb-2">
            Społeczność
          </p>
          <h2
            id="reviews-heading"
            className="font-display text-3xl font-medium text-stone-900 italic tracking-tight"
          >
            Opinie klientów
          </h2>
        </div>

        {!formOpen && !submitted && (
          <button
            onClick={() => setFormOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:border-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            Napisz opinię
          </button>
        )}
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 mb-10"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-6 gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Check size={22} strokeWidth={2} className="text-emerald-600" />
                  </div>
                  <p className="font-medium text-stone-900">Dziękujemy za opinię!</p>
                  <p className="text-sm text-stone-400">Twoja recenzja czeka na moderację.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <h3 className="font-medium text-stone-900 text-base">Twoja opinia</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      Ocena <span aria-hidden="true" className="text-green-800">*</span>
                    </label>
                    <StarPicker value={rating} onChange={setRating} />
                    {!rating && (
                      <p className="text-xs text-stone-400">Wybierz liczbę gwiazdek</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="review-name" className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      Imię <span aria-hidden="true" className="text-green-800">*</span>
                    </label>
                    <input
                      id="review-name"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Twoje imię"
                      className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="review-comment" className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      Komentarz <span aria-hidden="true" className="text-green-800">*</span>
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Podziel się swoją opinią o produkcie…"
                      className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-stone-500 transition-colors placeholder:text-stone-400 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={submitting || !rating}
                      className="px-6 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {submitting ? 'Wysyłanie…' : 'Wyślij opinię'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      className="px-4 py-2.5 text-sm text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                    >
                      Anuluj
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
          <MessageSquare size={24} strokeWidth={1} className="text-stone-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-stone-900 mb-1.5">Brak opinii</p>
          <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
            Ten produkt nie ma jeszcze żadnych recenzji.{' '}
            {!formOpen && (
              <button
                onClick={() => setFormOpen(true)}
                className="text-green-800 hover:underline cursor-pointer"
              >
                Napisz pierwszą!
              </button>
            )}
          </p>
        </div>
        <StarDisplay value={0} size={16} />
      </div>
    </section>
  )
}
