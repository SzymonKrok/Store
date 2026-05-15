'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Package } from 'lucide-react'
import { apiClient } from '../../../lib/axios'
import type { Order } from '../../../lib/api/orders'

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState(false)
  const [id, setId] = useState<string | null>(null)

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

        <div className="text-center mt-8">
          <Link
            href="/sklep"
            className="inline-flex items-center justify-center px-8 py-3 bg-stone-900 text-white font-medium rounded-2xl hover:bg-stone-700 transition-colors"
          >
            Kontynuuj zakupy
          </Link>
        </div>
      </main>
    </div>
  )
}
