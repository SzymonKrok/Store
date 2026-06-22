'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Download, Package, RotateCcw, X } from 'lucide-react'
import { apiClient } from '../../../lib/axios'
import type { Order } from '../../../lib/api/orders'
import { GuestConversionBanner } from '../../../components/GuestConversionBanner'
import { useAuth } from '../../../lib/auth'

const RETURNABLE = ['SHIPPED', 'DELIVERED']

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState(false)
  const [id, setId] = useState<string | null>(null)

  const [returnOpen, setReturnOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [returning, setReturning] = useState(false)
  const [returnDone, setReturnDone] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    apiClient
      .get<Order>(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError(true))
  }, [id])

  async function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setReturning(true)
    setReturnError(null)
    try {
      await apiClient.post(`/orders/${id}/return`, { reason, bankAccount })
      setReturnDone(true)
      setReturnOpen(false)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setReturnError(msg ?? 'Błąd podczas składania wniosku')
    } finally {
      setReturning(false)
    }
  }

  const canReturn = order && RETURNABLE.includes(order.status) && !returnDone

  return (
    <div className="min-h-screen bg-ink">
      <header className="h-16 border-b border-ink-600 bg-ink-950 flex items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-[0.28em] text-gold"
        >
          LUNE&nbsp;ATELIER
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <CheckCircle size={32} strokeWidth={1.5} className="text-gold" />
          </div>
          <h1 className="font-display text-3xl font-medium italic text-cream mb-2">
            Dziękujemy za zamówienie!
          </h1>
          <p className="text-cream-muted">
            {id && (
              <>
                Numer zamówienia:{' '}
                <span className="font-mono text-cream/80 text-sm">{id}</span>
              </>
            )}
          </p>
        </div>

        {order ? (
          <div className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-ink-600 flex items-center gap-2">
              <Package size={16} strokeWidth={1.5} className="text-gold" />
              <span className="font-medium text-cream text-sm">Produkty</span>
            </div>
            <div className="divide-y divide-ink-600">
              {order.items.map((item) => {
                const attrs = Object.entries(item.variantAttributes ?? {})
                return (
                  <div key={item.id} className="px-6 py-3 flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-cream">{item.productName}</p>
                      {attrs.length > 0 ? (
                        <p className="text-cream-muted text-xs">
                          {attrs.map(([k, v]) => `${k}: ${v}`).join(', ')} × {item.quantity}
                        </p>
                      ) : (
                        <p className="text-cream-muted text-xs">{item.variantSku} × {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-medium text-cream">
                      {(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)} zł
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-4 border-t border-ink-600 space-y-1.5 text-sm">
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-gold">
                  <span>Rabat</span>
                  <span>−{parseFloat(order.discountAmount).toFixed(2)} zł</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-cream text-base">
                <span>Razem</span>
                <span>{parseFloat(order.total).toFixed(2)} zł</span>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 text-center text-cream-muted text-sm">
            Nie można załadować szczegółów zamówienia.
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-ink-600 border-t-gold rounded-full animate-spin" />
          </div>
        )}

        {order?.invoiceUrl && (
          <div className="mt-4">
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-ink-800 border border-ink-600 rounded-2xl text-sm font-medium text-cream/80 hover:border-gold/50 hover:text-gold transition-colors"
            >
              <Download size={15} strokeWidth={1.5} />
              Pobierz fakturę
            </a>
          </div>
        )}

        {order && order.userId === null && !user && (
          <div className="mt-4">
            <GuestConversionBanner orderId={order.id} />
          </div>
        )}

        {returnDone && (
          <div className="mt-4 flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 text-sm text-cream/90">
            <CheckCircle size={15} strokeWidth={1.5} className="text-gold" />
            Wniosek zwrotu został złożony. Skontaktujemy się z Tobą wkrótce.
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/sklep"
            className="inline-flex items-center justify-center px-8 py-3 bg-gold text-ink font-semibold rounded-2xl hover:bg-gold-200 transition-colors"
          >
            Kontynuuj zakupy
          </Link>
          {canReturn && (
            <button
              onClick={() => setReturnOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-ink-600 text-cream/80 font-medium rounded-2xl hover:border-gold/50 hover:text-gold transition-colors text-sm"
            >
              <RotateCcw size={15} strokeWidth={1.5} />
              Zwróć zamówienie
            </button>
          )}
        </div>
      </main>

      {/* Return modal */}
      {returnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setReturnOpen(false)}
          />
          <div className="relative bg-ink-800 border border-ink-600 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium text-cream">Wniosek o zwrot</h2>
              <button
                onClick={() => setReturnOpen(false)}
                className="text-cream-muted hover:text-gold transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cream/80 mb-1.5">
                  Powód zwrotu <span className="text-cream-muted font-normal">(min. 10 znaków)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Opisz powód zwrotu…"
                  className="w-full border border-ink-600 bg-ink-700 rounded-xl px-3.5 py-2.5 text-sm text-cream placeholder:text-cream-muted/60 focus:outline-none focus:border-gold resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream/80 mb-1.5">
                  Numer konta bankowego (IBAN)
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  required
                  placeholder="PL00 0000 0000 0000 0000 0000 0000"
                  className="w-full border border-ink-600 bg-ink-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cream placeholder:text-cream-muted/60 placeholder:font-sans focus:outline-none focus:border-gold"
                />
                <p className="mt-1 text-xs text-cream-muted">
                  Środki zostaną zwrócone na ten rachunek w ciągu 14 dni roboczych.
                </p>
              </div>

              {returnError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                  {returnError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={returning}
                  className="flex-1 bg-gold text-ink text-sm font-semibold py-2.5 rounded-xl hover:bg-gold-200 disabled:opacity-50 transition-colors"
                >
                  {returning ? 'Wysyłanie…' : 'Złóż wniosek'}
                </button>
                <button
                  type="button"
                  onClick={() => setReturnOpen(false)}
                  className="flex-1 border border-ink-600 text-cream/80 text-sm font-medium py-2.5 rounded-xl hover:border-gold/50 hover:text-gold transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
