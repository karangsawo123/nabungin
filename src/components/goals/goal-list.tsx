'use client'

import * as React from 'react'
import { Target, Plus, Sparkles, Trophy, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { GoalCard } from '@/components/goals/goal-card'
import { CreateGoalDialog } from '@/components/goals/create-goal-dialog'
import { useWorkspace } from '@/components/groups/workspace-context'
import { getGoalsByWorkspace } from '@/actions/goals'
import { formatRupiah } from '@/lib/utils'
import type { Goal } from '@/types/database'

export interface GoalListProps {
  initialGoals?: Goal[]
  initialWorkspaceId?: string
}

export function GoalList({ initialGoals = [], initialWorkspaceId }: GoalListProps) {
  const { activeGroupId, activeGroup, refreshKey } = useWorkspace()

  const [prevWorkspaceId, setPrevWorkspaceId] = React.useState(activeGroupId)
  const [goals, setGoals] = React.useState<Goal[]>(() => {
    return initialWorkspaceId === activeGroupId ? initialGoals : []
  })
  const [isLoading, setIsLoading] = React.useState(
    !initialWorkspaceId || initialWorkspaceId !== activeGroupId
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  React.useEffect(() => {
    const handleGlobalRefresh = () => {
      setRefreshTrigger((c) => c + 1)
    }
    window.addEventListener('nabungin:refresh', handleGlobalRefresh)
    return () => {
      window.removeEventListener('nabungin:refresh', handleGlobalRefresh)
    }
  }, [])

  // Pola React resmi: sinkronisasi state saat props/activeGroupId berganti
  if (prevWorkspaceId !== activeGroupId) {
    setPrevWorkspaceId(activeGroupId)
    if (activeGroupId === initialWorkspaceId) {
      setGoals(initialGoals)
      setIsLoading(false)
    } else {
      setIsLoading(true)
      setGoals([])
    }
    setError(null)
  }

  React.useEffect(() => {
    let isCancelled = false
    if (!activeGroupId) return

    // Jika sama dengan inisial dan belum ada pemicu refresh, gunakan inisial
    if (
      activeGroupId === initialWorkspaceId &&
      initialGoals.length > 0 &&
      refreshTrigger === 0 &&
      refreshKey === 0
    ) {
      return
    }

    getGoalsByWorkspace(activeGroupId)
      .then((data) => {
        if (!isCancelled) {
          setGoals(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError('Gagal memuat daftar target tabungan. Silakan coba lagi.')
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [activeGroupId, initialWorkspaceId, initialGoals.length, refreshTrigger, refreshKey])

  const handleGoalCreated = (newGoal: Goal) => {
    setGoals((prev) => [newGoal, ...prev])
  }

  // Ringkasan metrik goals di workspace aktif
  const totalTarget = goals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0)
  const totalCurrent = goals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0)
  const achievedCount = goals.filter(
    (g) => g.status === 'achieved' || (Number(g.target_amount) > 0 && Number(g.current_amount) >= Number(g.target_amount))
  ).length

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Title, Count, and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {activeGroup?.type === 'shared' ? 'Shared Goals' : 'Personal Goals'}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">
              {goals.length} Target Terdaftar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Target Tabungan {activeGroup?.name}
          </h2>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Buat Target Tabungan</span>
        </Button>
      </div>

      {/* 2. Ringkasan Mini Stats jika memiliki target */}
      {goals.length > 0 && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-[#1C2538] bg-[#101522] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Target className="h-4 w-4 text-emerald-400" />
              <span>Total Nilai Target</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {formatRupiah(totalTarget)}
            </div>
          </div>

          <div className="rounded-2xl border border-[#1C2538] bg-[#101522] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span>Terkumpul Saat Ini</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
              {formatRupiah(totalCurrent)}
            </div>
          </div>

          <div className="rounded-2xl border border-[#1C2538] bg-[#101522] p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Target Tercapai</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {achievedCount} / {goals.length}
            </div>
          </div>
        </div>
      )}

      {/* 3. Error State */}
      {error && (
        <ErrorState
          title="Gagal Memuat Target"
          message={error}
          onRetry={() => setRefreshTrigger((c) => c + 1)}
        />
      )}

      {/* 4. Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-[#1C2538] bg-[#101522] p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-1/2 rounded" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/4 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Empty State */}
      {!isLoading && !error && goals.length === 0 && (
        <EmptyState
          icon={Target}
          title="Belum Ada Target Tabungan"
          description={`Ruang tabungan "${activeGroup?.name || 'ini'}" belum memiliki target. Buat target pertama untuk mulai memantau kemajuan tabunganmu.`}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateOpen(true)}
              className="min-h-[44px]"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Buat Target Pertama
            </Button>
          }
        />
      )}

      {/* 6. Goals Grid */}
      {!isLoading && !error && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Modal Buat Target */}
      <CreateGoalDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleGoalCreated}
      />
    </div>
  )
}
