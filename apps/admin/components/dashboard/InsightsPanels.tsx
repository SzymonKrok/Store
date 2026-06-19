'use client'

import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Eye,
  TrendingUp,
  ShoppingCart,
  MapPin,
  Tag,
  Truck,
  PackageX,
  MessageSquare,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { InsightsResponse, OrderStatus, DeliveryMethod } from '@/lib/api/insights'

interface Props {
  insights: InsightsResponse | undefined
  isLoading: boolean
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Oczekuje na płatność',
  PAID: 'Opłacone',
  PROCESSING: 'W realizacji',
  SHIPPED: 'Wysłane',
  DELIVERED: 'Dostarczone',
  CANCELLED: 'Anulowane',
  REFUNDED: 'Zwrócone',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PAID: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  REFUNDED: 'bg-rose-100 text-rose-700',
}

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  COURIER: 'Kurier',
  PARCEL_LOCKER: 'Paczkomat',
}

function formatPLN(value: number) {
  return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
}

export function InsightsPanels({ insights, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!insights) return null

  return (
    <div className="space-y-6">
      {/* Low stock — surfaced at the top so it grabs attention */}
      {insights.lowStockVariants.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="pt-5 space-y-3">
            <SectionHeading
              icon={<AlertTriangle size={15} className="text-amber-600" />}
              title="Niski stan magazynowy — kliknij, aby uzupełnić"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="text-left font-normal pb-2">Produkt</th>
                    <th className="text-left font-normal pb-2">Wariant</th>
                    <th className="text-left font-normal pb-2">SKU</th>
                    <th className="text-right font-normal pb-2">Stan</th>
                    <th className="w-10 pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {insights.lowStockVariants.map((v) => {
                    const variantLabel = Object.entries(v.attributes)
                      .map(([k, val]) => `${k}: ${val}`)
                      .join(', ')
                    return (
                      <tr key={`${v.productId}-${v.sku}`} className="border-b border-amber-100 last:border-0 hover:bg-amber-100/40 transition-colors">
                        <td className="py-2">
                          <Link
                            href={`/products/${v.productId}`}
                            className="text-slate-800 hover:text-amber-800 hover:underline font-medium"
                          >
                            {v.productName}
                          </Link>
                        </td>
                        <td className="py-2 text-slate-500 text-xs truncate max-w-[180px]">{variantLabel || '—'}</td>
                        <td className="py-2 font-mono text-xs text-slate-600">{v.sku}</td>
                        <td className="py-2 text-right">
                          <Badge className={v.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                            {v.stock === 0 ? 'Brak' : v.stock}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/products/${v.productId}`}
                            className="inline-flex items-center justify-center text-slate-400 hover:text-amber-700 transition-colors"
                            aria-label="Edytuj produkt"
                          >
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniKpi icon={<TrendingUp size={16} />} label="Średnia wartość zamówienia (30d)" value={formatPLN(insights.averageOrderValue)} />
        <MiniKpi icon={<Users size={16} />} label="Nowi klienci (30d)" value={insights.newCustomers30d.toString()} />
        <MiniKpi
          icon={<MessageSquare size={16} />}
          label="Recenzje do moderacji"
          value={insights.pendingReviews.toString()}
          alert={insights.pendingReviews > 0}
        />
        <MiniKpi
          icon={<PackageX size={16} />}
          label="Zwroty oczekujące"
          value={insights.pendingReturns.toString()}
          alert={insights.pendingReturns > 0}
        />
      </div>

      {/* 3-column row: status breakdown / delivery split / top cities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 space-y-3">
            <SectionHeading icon={<ShoppingCart size={15} />} title="Status zamówień" />
            <div className="space-y-1.5">
              {(Object.keys(insights.orderStatusBreakdown) as OrderStatus[]).map((status) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <Badge className={`${STATUS_COLORS[status]} text-xs font-normal`}>
                    {STATUS_LABELS[status]}
                  </Badge>
                  <span className="font-mono text-slate-700">
                    {insights.orderStatusBreakdown[status]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-3">
            <SectionHeading icon={<Truck size={15} />} title="Metoda dostawy (opłacone)" />
            <DeliveryBars split={insights.deliveryMethodSplit} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-3">
            <SectionHeading icon={<MapPin size={15} />} title="Top miasta" />
            {insights.topCities.length === 0 ? (
              <EmptyState text="Brak zamówień" />
            ) : (
              <ol className="space-y-1.5 text-sm">
                {insights.topCities.map((c, i) => (
                  <li key={c.city} className="flex items-center justify-between">
                    <span className="text-slate-700 truncate">
                      <span className="text-slate-400 mr-2 font-mono">{i + 1}.</span>
                      {c.city}
                    </span>
                    <span className="font-mono text-slate-600">{c.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products + Top viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 space-y-3">
            <SectionHeading icon={<TrendingUp size={15} />} title="Najlepiej sprzedające się (30d)" />
            {insights.topProducts.length === 0 ? (
              <EmptyState text="Brak sprzedaży w ostatnich 30 dniach" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="text-left font-normal pb-2">Produkt</th>
                    <th className="text-right font-normal pb-2">Sztuk</th>
                    <th className="text-right font-normal pb-2">Przychód</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.topProducts.map((p) => (
                    <tr key={p.productName} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-700 truncate max-w-[180px]">{p.productName}</td>
                      <td className="py-2 text-right font-mono">{p.totalSold}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{formatPLN(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-3">
            <SectionHeading icon={<Eye size={15} />} title="Najczęściej oglądane" />
            {insights.topViewed.length === 0 ? (
              <EmptyState text="Brak wyświetleń" />
            ) : (
              <ol className="space-y-1.5 text-sm">
                {insights.topViewed.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="text-slate-700 truncate">
                      <span className="text-slate-400 mr-2 font-mono">{i + 1}.</span>
                      <Link
                        href={`/products/${p.id}`}
                        className="hover:text-slate-900 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </span>
                    <span className="font-mono text-slate-600">
                      {p.viewCount.toLocaleString('pl-PL')}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coupon performance */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <SectionHeading icon={<Tag size={15} />} title="Skuteczność kuponów" />
          {insights.couponPerformance.length === 0 ? (
            <EmptyState text="Brak wykorzystanych kuponów" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="text-left font-normal pb-2">Kod</th>
                  <th className="text-left font-normal pb-2">Wartość</th>
                  <th className="text-right font-normal pb-2">Użyć</th>
                  <th className="text-right font-normal pb-2">Łączny rabat</th>
                </tr>
              </thead>
              <tbody>
                {insights.couponPerformance.map((c) => (
                  <tr key={c.code} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 font-mono">{c.code}</td>
                    <td className="py-2 text-slate-600">
                      {c.type === 'PERCENTAGE' ? `${c.value}%` : formatPLN(c.value)}
                    </td>
                    <td className="py-2 text-right font-mono">{c.redemptions}</td>
                    <td className="py-2 text-right font-mono text-slate-600">{formatPLN(c.totalDiscount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Abandoned carts */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <SectionHeading icon={<ShoppingCart size={15} />} title="Porzucone koszyki (>2h bez aktywności)" />
          {insights.abandonedCarts.length === 0 ? (
            <EmptyState text="Brak porzuconych koszyków" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="text-left font-normal pb-2">Klient</th>
                  <th className="text-left font-normal pb-2">Produkty</th>
                  <th className="text-right font-normal pb-2">Sztuk</th>
                  <th className="text-right font-normal pb-2">Wartość</th>
                  <th className="text-right font-normal pb-2">Ostatnia aktywność</th>
                </tr>
              </thead>
              <tbody>
                {insights.abandonedCarts.map((cart) => (
                  <tr key={cart.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 text-slate-700 truncate max-w-[180px]">{cart.identifier}</td>
                    <td className="py-2 text-slate-500 text-xs truncate max-w-[260px]">{cart.itemPreview}</td>
                    <td className="py-2 text-right font-mono">{cart.itemCount}</td>
                    <td className="py-2 text-right font-mono text-slate-600">{formatPLN(cart.totalValue)}</td>
                    <td className="py-2 text-right text-xs text-slate-400" title={format(new Date(cart.updatedAt), 'd MMM yyyy HH:mm', { locale: pl })}>
                      {formatDistanceToNow(new Date(cart.updatedAt), { addSuffix: true, locale: pl })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MiniKpi({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string; alert?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-slate-400">{icon}</span>
          {label}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xl font-semibold text-slate-900 font-mono">{value}</span>
          {alert && <Badge className="bg-amber-100 text-amber-700">!</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <span className="text-slate-400">{icon}</span>
      {title}
    </h3>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 py-4 text-center">{text}</p>
}

function DeliveryBars({ split }: { split: Record<DeliveryMethod, number> }) {
  const total = split.COURIER + split.PARCEL_LOCKER
  if (total === 0) return <EmptyState text="Brak danych" />

  return (
    <div className="space-y-2.5">
      {(Object.keys(split) as DeliveryMethod[]).map((method) => {
        const count = split[method]
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={method}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700">{DELIVERY_LABELS[method]}</span>
              <span className="text-slate-500 font-mono">
                {count} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-600 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
