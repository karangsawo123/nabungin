import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Calendar } from 'lucide-react'
import { ActiveWorkspaceSummary } from '@/components/groups/active-workspace-summary'
import { FinancialOverview } from '@/components/dashboard/financial-overview'
import { AnalyticsSection } from '@/components/analytics/analytics-section'
import { GoalList } from '@/components/goals/goal-list'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  const displayName = profile?.full_name || 'Penabung'

  return (
    <div className="space-y-6">
      {/* 1. Header Ringkas Sambutan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1C2538] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Nabungin Foundation
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date().toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Halo, {displayName}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola ruang tabungan personal dan kolaboratif Anda secara aman dan terisolasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="brand" className="py-1 px-3">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Workspace Active
          </Badge>
        </div>
      </div>

      {/* 2. Indikator & Ringkasan Workspace Aktif */}
      <ActiveWorkspaceSummary />

      {/* 3. Financial Overview Terkoneksi Ledger (Hero, Metrics, Trends, Recent Tx) */}
      <FinancialOverview />

      {/* 4. Analitik, Tren Bulanan, Kontribusi & Proyeksi Finansial */}
      <AnalyticsSection />

      {/* 5. Section Target Tabungan / Goals Terkoneksi Active Workspace */}
      <GoalList />
    </div>
  )
}
