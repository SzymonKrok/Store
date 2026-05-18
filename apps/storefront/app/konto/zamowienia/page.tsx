'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { useOrders } from '../../../lib/api/orders'

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Oczekuje na płatność',
  PAID: 'Opłacone',
  PROCESSING: 'W realizacji',
  SHIPPED: 'Wysłane',
  DELIVERED: 'Dostarczone',
  CANCELLED: 'Anulowane',
  REFUNDED: 'Zwrócone',
}

const STATUS_CLS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  REFUNDED: 'bg-stone-100 text-stone-600 border-stone-200',
}

export default function ZamowieniaPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useOrders(page)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/konto" className="text-stone-400 hover:text-stone-900 transition-colors">
          <ChevronLeft size={18} strokeWidth={1.5} />
        </Link>
        <h1 className="font-display text-3xl font-medium text-stone-900 italic">Moje zamówienia</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500 text-sm">
          Nie udało się załadować zamówień. Spróbuj odświeżyć stronę.
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto">
            <Package size={26} strokeWidth={1} className="text-stone-400" />
          </div>
          <div>
            <p className="font-medium text-stone-900 mb-1">Brak zamówień</p>
            <p className="text-stone-400 text-sm">Twoja historia zamówień pojawi się tutaj.</p>
          </div>
          <Link
            href="/sklep"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition-colors"
          >
            Przeglądaj sklep
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((order) => (
              <Link
                key={order.id}
                href={`/order-confirmation/${order.id}`}
                className="block bg-white border border-stone-200 rounded-2xl p-5 hover:border-stone-400 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-stone-400 truncate">#{order.id.slice(-8).toUpperCase()}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${STATUS_CLS[order.status] ?? 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500">
                      {order.items.length} {order.items.length === 1 ? 'produkt' : 'produkty'}
                      {' · '}
                      {new Date(order.createdAt).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-stone-900 tabular-nums">
                      {Number(order.total).toFixed(2)} zł
                    </p>
                    <ChevronRight size={16} strokeWidth={1.5} className="text-stone-300 mt-1 ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <span className="text-sm text-stone-500 tabular-nums">
                {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 text-stone-500 hover:text-stone-900 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
