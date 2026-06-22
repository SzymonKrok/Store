'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download, Package } from 'lucide-react'
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
  PENDING_PAYMENT: 'bg-gold/10 text-gold border-gold/30',
  PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  SHIPPED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
  REFUNDED: 'bg-ink-700 text-cream-muted border-ink-600',
}

export default function ZamowieniaPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useOrders(page)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/konto" className="text-cream-muted hover:text-gold transition-colors">
          <ChevronLeft size={18} strokeWidth={1.5} />
        </Link>
        <h1 className="font-display text-3xl font-medium text-cream italic">Moje zamówienia</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-ink-600 border-t-gold rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-ink-800 border border-ink-600 rounded-2xl p-8 text-center text-cream-muted text-sm">
          Nie udało się załadować zamówień. Spróbuj odświeżyć stronę.
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="bg-ink-800 border border-ink-600 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-ink-700 flex items-center justify-center mx-auto">
            <Package size={26} strokeWidth={1} className="text-gold" />
          </div>
          <div>
            <p className="font-medium text-cream mb-1">Brak zamówień</p>
            <p className="text-cream-muted text-sm">Twoja historia zamówień pojawi się tutaj.</p>
          </div>
          <Link
            href="/sklep"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gold text-ink text-sm font-semibold rounded-xl hover:bg-gold-200 transition-colors"
          >
            Przeglądaj sklep
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((order) => (
              <div key={order.id} className="bg-ink-800 border border-ink-600 rounded-2xl overflow-hidden hover:border-gold/40 hover:shadow-[0_4px_20px_rgba(200,164,92,0.1)] transition-all">
                <Link
                  href={`/order-confirmation/${order.id}`}
                  className="block p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-cream-muted truncate">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${STATUS_CLS[order.status] ?? 'bg-ink-700 text-cream-muted border-ink-600'}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="text-sm text-cream-muted">
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
                      <p className="font-semibold text-gold tabular-nums">
                        {Number(order.total).toFixed(2)} zł
                      </p>
                      <ChevronRight size={16} strokeWidth={1.5} className="text-cream-muted mt-1 ml-auto" />
                    </div>
                  </div>
                </Link>
                {order.invoiceUrl && (
                  <div className="border-t border-ink-600 px-5 py-2.5">
                    <a
                      href={order.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-cream-muted hover:text-gold transition-colors"
                    >
                      <Download size={12} strokeWidth={1.5} />
                      Pobierz fakturę
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-cream-muted hover:text-gold disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <span className="text-sm text-cream-muted tabular-nums">
                {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 text-cream-muted hover:text-gold disabled:opacity-30 transition-colors cursor-pointer"
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
