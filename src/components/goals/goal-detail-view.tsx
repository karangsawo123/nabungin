'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Target,
  Calendar,
  CheckCircle2,
  Edit3,
  Trophy,
  Wallet,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EditGoalDialog } from '@/components/goals/edit-goal-dialog'
import { CreateTransactionDialog } from '@/components/transactions/create-transaction-dialog'
import { getTransactionsByWorkspace, type TransactionWithDetails } from '@/actions/transactions'
import { getGoalById } from '@/actions/goals'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { Goal, Group, MemberRole, TransactionType } from '@/types/database'

export interface GoalDetailViewProps {
  initialGoal: Goal
  workspace: Group
  userRole: MemberRole
}

export function GoalDetailView({
  initialGoal,
  workspace,
  userRole,
}: GoalDetailViewProps) {
  const [goal, setGoal] = React.useState<Goal>(initialGoal)
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  // Transaction Dialog & History State
  const [goalTransactions, setGoalTransactions] = React.useState<TransactionWithDetails[]>([])
  const [loadingTx, setLoadingTx] = React.useState(true)
  const [isTxDialogOpen, setIsTxDialogOpen] = React.useState(false)
  const [dialogType, setDialogType] = React.useState<TransactionType>('deposit')

  const loadTransactions = React.useCallback(async () => {
    try {
      setLoadingTx(true)
      const [txList, refreshedGoal] = await Promise.all([
        getTransactionsByWorkspace(workspace.id),
        getGoalById(goal.id),
      ])
      setGoalTransactions(txList.filter((tx: TransactionWithDetails) => tx.goal_id === goal.id))
      if (refreshedGoal) {
        setGoal(refreshedGoal)
      }
    } catch {
      // silent
    } finally {
      setLoadingTx(false)
    }
  }, [workspace.id, goal.id])

  React.useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  React.useEffect(() => {
    const handleGlobalRefresh = () => {
      loadTransactions()
    }
    window.addEventListener('nabungin:refresh', handleGlobalRefresh)
    return () => {
      window.removeEventListener('nabungin:refresh', handleGlobalRefresh)
    }
  }, [loadTransactions])

  const current = Number(goal.current_amount) || 0
  const target = Number(goal.target_amount) || 0

  // Perhitungan aman edge-case
  const rawPercent = target > 0 ? (current / target) * 100 : 0
  const validPercent = isFinite(rawPercent) && !isNaN(rawPercent) ? Math.max(0, rawPercent) : 0
  const visualProgress = Math.min(100, Math.round(validPercent))
  const displayPercent = Math.round(validPercent * 10) / 10
  const remaining = Math.max(0, target - current)
  const isAchieved = target > 0 && current >= target

  return (
    <div className="space-y-6">
      {/* 1. Back Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1C2538] pb-4">
        <Link
          href="/goals"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors self-start focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-lg p-1 -ml-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Target</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="min-h-[40px]"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
            <span>Edit Target</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <div className="rounded-3xl border border-[#1C2538] bg-gradient-to-b from-[#141A2A] to-[#0E1320] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={workspace.type === 'shared' ? 'shared' : 'personal'}
                className="text-[10px] uppercase font-semibold"
              >
                {workspace.type} Workspace
              </Badge>
              <Badge variant="outline" className="text-[10px] text-slate-400">
                {workspace.name}
              </Badge>
              <Badge variant="outline" className="text-[10px] text-slate-400 capitalize">
                Peran: {userRole}
              </Badge>
              {isAchieved ? (
                <Badge variant="milestone" className="text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Target Tercapai
                </Badge>
              ) : (
                <Badge variant="brand" className="text-[10px]">
                  Status: Aktif
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {goal.name}
              </h1>
              {goal.description && (
                <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 text-xs text-slate-400">
            {goal.deadline && (
              <div className="flex items-center gap-1.5 bg-[#101522] border border-[#1C2538] rounded-xl px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                <span>Target: {formatDate(goal.deadline)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Clock className="h-3 w-3" />
              <span>Dibuat: {formatDate(goal.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Milestone Banner if Achieved */}
      {isAchieved && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 text-amber-200 flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300">
              Selamat! Target Tabungan Ini Telah Tercapai 🎉
            </h4>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Target nominal sebesar {formatRupiah(target)} telah berhasil dipenuhi.
              {goal.achieved_at && (
                <span className="ml-1 font-semibold">
                  (Tercapai pada: {formatDate(goal.achieved_at)})
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* 4. Financial Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              Saldo Terkumpul
            </span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatRupiah(current)}
            </div>
            <p className="text-[11px] text-slate-500">
              Otomatis dihitung dari mutasi transaksi ledger.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-blue-400" />
              Target Finansial
            </span>
            <div className="text-2xl font-extrabold font-mono text-white">
              {formatRupiah(target)}
            </div>
            <p className="text-[11px] text-slate-500">
              Nominal total yang ingin dicapai.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-400" />
              Sisa Dana Diperlukan
            </span>
            <div className="text-2xl font-extrabold font-mono text-amber-400">
              {formatRupiah(remaining)}
            </div>
            <p className="text-[11px] text-slate-500">
              {isAchieved ? 'Target sudah lunas terpenuhi.' : 'Kekurangan dana untuk mencapai target.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-purple-400" />
              Pencapaian Progres
            </span>
            <div className="text-2xl font-extrabold font-mono text-white">
              {displayPercent}%
            </div>
            <p className="text-[11px] text-slate-500">
              {displayPercent >= 100 ? '100% Tercapai lunas' : `${displayPercent}% dari target`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Progress Section Card */}
      <Card>
        <CardHeader>
          <CardTitle>Indikator Kemajuan Tabungan</CardTitle>
          <CardDescription>
            Visualisasi proporsi dana yang telah terkumpul terhadap target nominal yang ditetapkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Progress
              value={visualProgress}
              variant={isAchieved ? 'amber' : 'emerald'}
              aria-label={`Progress pencapaian ${goal.name}`}
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">
                {formatRupiah(current)} ({displayPercent}%)
              </span>
              <span>Target: {formatRupiah(target)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Riwayat Transaksi Nyata untuk Target Ini */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Riwayat Mutasi & Transaksi</CardTitle>
              <CardDescription>
                Daftar penyetoran dan penarikan yang dialokasikan khusus ke target &quot;{goal.name}&quot;.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="deposit"
                size="sm"
                onClick={() => {
                  setDialogType('deposit')
                  setIsTxDialogOpen(true)
                }}
                className="min-h-[38px]"
              >
                + Setor ke Target
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDialogType('withdrawal')
                  setIsTxDialogOpen(true)
                }}
                disabled={current <= 0}
                className="min-h-[38px]"
              >
                - Tarik Saldo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <Clock className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-400" />
              Memuat mutasi transaksi...
            </div>
          ) : goalTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1C2538] bg-[#0E1320] p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 mx-auto mb-3">
                <Wallet className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">
                Belum Ada Mutasi Transaksi
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Lakukan setoran perdana untuk mulai mengakumulasi tabungan mencapai target &quot;{goal.name}&quot;.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1C2538] border border-[#1C2538] rounded-xl overflow-hidden bg-[#0A0E18]">
              {goalTransactions.map((tx) => {
                const isDeposit = tx.type === 'deposit'
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 hover:bg-[#111726] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isDeposit
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isDeposit ? '+' : '-'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {tx.notes || (isDeposit ? 'Setoran Tabungan' : 'Penarikan Dana')}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatDate(tx.transaction_date || tx.created_at)}</span>
                          {tx.categories && (
                            <>
                              <span>•</span>
                              <span className="text-slate-300">{tx.categories.name}</span>
                            </>
                          )}
                          {tx.profiles && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">{tx.profiles.full_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`font-mono text-xs sm:text-sm font-bold ${
                        isDeposit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}
                      {formatRupiah(Number(tx.amount))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Edit Goal */}
      <EditGoalDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        goal={goal}
        onSuccess={(updated) => setGoal(updated)}
      />

      {/* Dialog Create Transaction */}
      <CreateTransactionDialog
        isOpen={isTxDialogOpen}
        onClose={() => setIsTxDialogOpen(false)}
        defaultType={dialogType}
        defaultGoalId={goal.id}
        onSuccess={() => {
          loadTransactions()
        }}
      />
    </div>
  )
}
