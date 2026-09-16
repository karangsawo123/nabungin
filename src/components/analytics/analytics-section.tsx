'use client'

import * as React from 'react'
import { MonthlyChart } from './monthly-chart'
import { ContributionBreakdown } from './contribution-breakdown'
import { SavingProjections } from './saving-projections'
import { useWorkspace } from '@/components/groups/workspace-context'
import {
  getWorkspaceAnalyticsAction,
  type WorkspaceAnalyticsData,
} from '@/actions/analytics'

interface AnalyticsSectionProps {
  workspaceId?: string
  isPersonal?: boolean
  className?: string
}

export function AnalyticsSection({
  workspaceId: propWorkspaceId,
  isPersonal: propIsPersonal,
  className = '',
}: AnalyticsSectionProps) {
  const { activeGroupId, isPersonal: contextIsPersonal, refreshKey } = useWorkspace()
  const workspaceId = propWorkspaceId || activeGroupId
  const isPersonal = propIsPersonal !== undefined ? propIsPersonal : contextIsPersonal

  const [data, setData] = React.useState<WorkspaceAnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [localTrigger, setLocalTrigger] = React.useState(0)

  React.useEffect(() => {
    const handleGlobalRefresh = () => {
      setLocalTrigger((c) => c + 1)
    }
    window.addEventListener('nabungin:refresh', handleGlobalRefresh)
    return () => {
      window.removeEventListener('nabungin:refresh', handleGlobalRefresh)
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true
    if (!workspaceId) return

    async function loadAnalytics() {
      try {
        setLoading(true)
        const analytics = await getWorkspaceAnalyticsAction(workspaceId)
        if (isMounted) {
          setData(analytics)
        }
      } catch {
        // silent error fallback
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAnalytics()

    return () => {
      isMounted = false
    }
  }, [workspaceId, refreshKey, localTrigger])

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-64 rounded-2xl border border-[#1C2538] bg-[#0E1320] animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Target Celebration & Estimasi Proyeksi */}
      <SavingProjections projections={data.projections} />

      {/* Grid Grafik Bulanan & Breakdown Kontribusi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyChart metrics={data.monthlyMetrics} />
        </div>
        <div className="lg:col-span-1">
          <ContributionBreakdown
            isPersonal={isPersonal}
            contributions={data.contributions}
            categoryAllocations={data.categoryAllocations}
          />
        </div>
      </div>
    </div>
  )
}
