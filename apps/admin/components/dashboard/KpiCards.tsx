'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatsResponse } from '@/lib/api/stats'

interface Props {
  kpis: StatsResponse['kpis'] | undefined
  isLoading: boolean
}

export function KpiCards({ kpis, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!kpis) return null

  const cards = [
    {
      label: 'Przychód (miesiąc)',
      value: kpis.revenueThisMonth.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }),
      badge: null,
    },
    {
      label: 'Zamówienia łącznie',
      value: kpis.totalOrders.toLocaleString('pl-PL'),
      badge: null,
    },
    {
      label: 'Oczekuje na płatność',
      value: kpis.pendingPaymentOrders.toLocaleString('pl-PL'),
      badge: kpis.pendingPaymentOrders > 0 ? 'amber' : null,
    },
    {
      label: 'Niski stan magazynowy',
      value: kpis.lowStockVariants.toLocaleString('pl-PL'),
      badge: kpis.lowStockVariants > 0 ? 'red' : null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold text-cream font-mono">{card.value}</span>
              {card.badge === 'amber' && <Badge className="bg-amber-100 text-amber-700">!</Badge>}
              {card.badge === 'red' && <Badge className="bg-red-100 text-red-700">!</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
