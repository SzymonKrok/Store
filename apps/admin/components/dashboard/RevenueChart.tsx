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
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => format(parseISO(d), 'd MMM', { locale: pl })}
              tick={{ fontSize: 12, fill: '#A39E94' }}
            />
            <YAxis
              tickFormatter={(v: number) => v.toLocaleString('pl-PL') + ' zł'}
              tick={{ fontSize: 12, fill: '#A39E94' }}
              width={80}
            />
            <Tooltip
              formatter={(v) => [(Number(v)).toLocaleString('pl-PL') + ' zł', 'Przychód']}
              contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #262626', borderRadius: '8px', color: '#F5F0E6' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#C8A45C"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#C8A45C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
