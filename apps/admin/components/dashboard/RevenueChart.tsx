'use client'

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { StatsResponse } from '@/lib/api/stats'

interface Props {
  chart: StatsResponse['chart'] | undefined
  isLoading: boolean
}

export function RevenueChart({ chart, isLoading }: Props) {
  if (isLoading) {
    return <Skeleton className="h-[300px] rounded-xl" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Przychód (ostatnie 30 dni)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => format(parseISO(d), 'd MMM', { locale: pl })}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v: number) => v.toLocaleString('pl-PL') + ' zł'}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip
              formatter={(v) => [(Number(v)).toLocaleString('pl-PL') + ' zł', 'Przychód']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
