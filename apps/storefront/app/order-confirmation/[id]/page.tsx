'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Package, RotateCcw, X } from 'lucide-react'
import { apiClient } from '../../../lib/axios'
import type { Order } from '../../../lib/api/orders'
import { GuestConversionBanner } from '../../../components/GuestConversionBanner'

const RETURNABLE = ['SHIPPED', 'DELIVERED']

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
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
    <div className="min-h-screen bg-stone-50">
      <header className="h-16 border-b border-stone-200 bg-white flex items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-[0.18em] text-stone-900 uppercase"
        >
          Store
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
            <CheckCircle size={32} strokeWidth={1.5} className="text-green-700" />
          </div>
          <h1 className="font-display text-3xl font-medium italic text-stone-900 mb-2">
            Dziękujemy za zamówienie!
          </h1>
          <p className="text-stone-500">
            {id && (
              <>
                Numer zamówienia:{' '}
                <span className="font-mono text-stone-700 text-sm">{id}</span>
              </>
            )}
          </p>
        </div>

        {order ? (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
              <Package size={16} strokeWidth={1.5} className="text-stone-500" />
              <span className="font-medium text-stone-900 text-sm">Produkty</span>
            </div>
            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-3 flex justify-between text-sm">
                  <div>
                    <p className="font-medium text-stone-900">{item.productName}</p>
                    <p className="text-stone-400 text-xs">{item.variantSku} × {item.quantity}</p>
                  </div>
                  <p className="font-medium text-stone-900">
                    {(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)} zł
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-stone-100 space-y-1.5 text-sm">
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Rabat</span>
                  <span>−{parseFloat(order.discountAmount).toFixed(2)} zł</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-stone-900 text-base">
                <span>Razem</span>
                <span>{parseFloat(order.total).toFixed(2)} zł</span>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500 text-sm">
            Nie można załadować szczegółów zamówienia.
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          </div>
        )}

        {order && order.userId === null && (
          <div className="mt-4">
            <GuestConversionBanner orderId={order.id} />
          </div>
        )}

        {returnDone && (
          <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            <CheckCircle size={15} strokeWidth={1.5} />
            Wniosek zwrotu został złożony. Skontaktujemy się z Tobą wkrótce.
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/sklep"
            className="inline-flex items-center justify-center px-8 py-3 bg-stone-900 text-white font-medium rounded-2xl hover:bg-stone-700 transition-colors"
          >
            Kontynuuj zakupy
          </Link>
          {canReturn && (
            <button
              onClick={() => setReturnOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-stone-300 text-stone-700 font-medium rounded-2xl hover:bg-stone-50 transition-colors text-sm"
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium text-stone-900">Wniosek o zwrot</h2>
              <button
                onClick={() => setReturnOpen(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Powód zwrotu <span className="text-stone-400 font-normal">(min. 10 znaków)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Opisz powód zwrotu…"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Numer konta bankowego (IBAN)
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  required
                  placeholder="PL00 0000 0000 0000 0000 0000 0000"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
                <p className="mt-1 text-xs text-stone-400">
                  Środki zostaną zwrócone na ten rachunek w ciągu 14 dni roboczych.
                </p>
              </div>

              {returnError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {returnError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={returning}
                  className="flex-1 bg-stone-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {returning ? 'Wysyłanie…' : 'Złóż wniosek'}
                </button>
                <button
                  type="button"
                  onClick={() => setReturnOpen(false)}
                  className="flex-1 border border-stone-300 text-stone-700 text-sm font-medium py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
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
