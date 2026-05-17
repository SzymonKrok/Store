'use client'

import { useStats } from '@/lib/api/stats'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { RevenueChart } from '@/components/dashboard/RevenueChart'

export default function DashboardPage() {
  const { data, isLoading } = useStats()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <KpiCards kpis={data?.kpis} isLoading={isLoading} />
      <RevenueChart chart={data?.chart} isLoading={isLoading} />
    </div>
  )
}
