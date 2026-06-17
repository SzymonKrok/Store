'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { apiClient } from '@/lib/axios'

interface Review {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt: string
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
            className={n <= active ? 'text-amber-400 fill-amber-400' : 'text-stone-300 fill-stone-100'}
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
          className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-100'}
        />
      ))}
    </div>
  )
}

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest'

export function ReviewsSection({ productId }: { productId: string }) {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [filterStar, setFilterStar] = useState<number | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data } = await apiClient.get<Review[]>(`/reviews?productId=${productId}`)
      return data
    },
  })

  const { mutateAsync: submitReview, isPending, isSuccess } = useMutation({
    mutationFn: async () => {
      await apiClient.post('/reviews', { productId, authorName: name, rating, comment })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] })
      setTimeout(() => {
        setFormOpen(false)
        setRating(0)
        setName('')
        setComment('')
      }, 2500)
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    await submitReview()
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const filtered = reviews
    .filter((r) => filterStar === null || r.rating === filterStar)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === 'highest') return b.rating - a.rating
      return a.rating - b.rating
    })

  return (
    <section className="border-t border-stone-100 py-14" aria-labelledby="reviews-heading">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 mb-2">
            Społeczność
          </p>
          <h2
            id="reviews-heading"
            className="font-display text-3xl font-medium text-stone-900 italic tracking-tight"
          >
            Opinie klientów
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarDisplay value={Math.round(avgRating)} size={14} />
              <span className="text-sm text-stone-500">
                {avgRating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'opinia' : reviews.length < 5 ? 'opinie' : 'opinii'}
              </span>
            </div>
          )}
        </div>

        {!formOpen && !isSuccess && (
          <button
            onClick={() => setFormOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:border-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            Napisz opinię
          </button>
        )}
      </div>

      {/* Review form */}
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
              {isSuccess ? (
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
                <motion.form key="form" onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-medium text-stone-900 text-base">Twoja opinia</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      Ocena <span aria-hidden="true" className="text-amber-700">*</span>
                    </label>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="review-name" className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      Imię <span aria-hidden="true" className="text-amber-700">*</span>
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
                      Komentarz <span aria-hidden="true" className="text-amber-700">*</span>
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
                      disabled={isPending || !rating}
                      className="px-6 py-2.5 bg-amber-800 text-white text-sm font-medium rounded-xl hover:bg-amber-900 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isPending ? 'Wysyłanie…' : 'Wyślij opinię'}
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

      {/* Filter + sort bar — only when there are reviews */}
      {!isLoading && reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Star filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterStar(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                filterStar === null
                  ? 'bg-amber-800 text-white border-amber-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-400'
              }`}
            >
              Wszystkie
            </button>
            {[5, 4, 3, 2, 1].map((n) => {
              const count = reviews.filter((r) => r.rating === n).length
              if (count === 0) return null
              return (
                <button
                  key={n}
                  onClick={() => setFilterStar(filterStar === n ? null : n)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    filterStar === n
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-amber-400'
                  }`}
                >
                  <Star size={11} strokeWidth={1.5} className={filterStar === n ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
                  {n} <span className="text-xs opacity-70">({count})</span>
                </button>
              )
            })}
          </div>

          {/* Sort select */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="ml-auto bg-white border border-stone-200 text-stone-700 text-xs rounded-xl px-3 py-2 hover:border-amber-400 focus:outline-none focus:border-amber-600 transition-colors cursor-pointer"
          >
            <option value="newest">Najnowsze</option>
            <option value="oldest">Najstarsze</option>
            <option value="highest">Najwyższa ocena</option>
            <option value="lowest">Najniższa ocena</option>
          </select>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 animate-pulse">
              <div className="h-3 w-24 bg-stone-100 rounded mb-3" />
              <div className="h-3 w-full bg-stone-100 rounded mb-2" />
              <div className="h-3 w-2/3 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
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
                  className="text-amber-700 hover:underline cursor-pointer"
                >
                  Napisz pierwszą!
                </button>
              )}
            </p>
          </div>
          <StarDisplay value={0} size={16} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-sm text-stone-400">Brak opinii z oceną {filterStar}★</p>
          <button
            onClick={() => setFilterStar(null)}
            className="text-xs text-amber-700 hover:underline cursor-pointer"
          >
            Pokaż wszystkie
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{review.authorName}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {format(parseISO(review.createdAt), 'd MMMM yyyy', { locale: pl })}
                  </p>
                </div>
                <StarDisplay value={review.rating} size={13} />
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{review.comment}</p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
