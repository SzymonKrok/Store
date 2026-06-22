'use client'

import { useStats } from '@/lib/api/stats'
import { useInsights } from '@/lib/api/insights'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { InsightsPanels } from '@/components/dashboard/InsightsPanels'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: insights, isLoading: insightsLoading } = useInsights()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cream">Dashboard</h1>
      <KpiCards kpis={stats?.kpis} isLoading={statsLoading} />
      <RevenueChart chart={stats?.chart} isLoading={statsLoading} />
      <InsightsPanels insights={insights} isLoading={insightsLoading} />
    </div>
  )
}
