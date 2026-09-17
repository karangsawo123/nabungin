'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  Trophy,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { CreateTransactionDialog } from '@/components/transactions/create-transaction-dialog'
import { SmartQuickAddModal } from '@/components/transactions/smart-quick-add-modal'
import { useWorkspace } from '@/components/groups/workspace-context'
import { getGoalsByWorkspace } from '@/actions/goals'
import {
  getTransactionsByWorkspace,
  type TransactionWithDetails,
} from '@/actions/transactions'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { Goal, TransactionType } from '@/types/database'

export function FinancialOverview() {
  const { activeGroupId, activeGroup, refreshKey } = useWorkspace()

  const [goals, setGoals] = React.useState<Goal[]>([])
  const [transactions, setTransactions] = React.useState<TransactionWithDetails[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isAiQuickAddOpen, setIsAiQuickAddOpen] = React.useState(false)
  const [fullFormPrefill, setFullFormPrefill] = React.useState<{
    type: TransactionType
    goalId: string
    categoryId: string
    amount: number
    notes: string
  } | null>(null)
  const [dialogType, setDialogType] = React.useState<TransactionType>('deposit')
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

  React.useEffect(() => {
    let isCancelled = false
    if (!activeGroupId) return

    setIsLoading(true)

    Promise.all([
      getGoalsByWorkspace(activeGroupId),
      getTransactionsByWorkspace(activeGroupId),
    ])
      .then(([goalsData, txData]) => {
        if (!isCancelled) {
          setGoals(goalsData)
          setTransactions(txData)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [activeGroupId, refreshTrigger, refreshKey])

  // Agregasi Keuangan Nyata
  const totalTarget = goals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0)
  const totalBalance = goals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0)

  const totalDeposit = transactions
    .filter((tx) => tx.type === 'deposit')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

  const totalWithdrawal = transactions
    .filter((tx) => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

  const achievedGoalsCount = goals.filter(
    (g) => Number(g.target_amount) > 0 && Number(g.current_amount) >= Number(g.target_amount)
  ).length
  const activeGoalsCount = goals.length - achievedGoalsCount

  const rawPercent = totalTarget > 0 ? (totalBalance / totalTarget) * 100 : 0
  const visualProgress = Math.min(100, Math.round(isFinite(rawPercent) ? rawPercent : 0))

  const recentTransactions = transactions.slice(0, 5)

  const openDeposit = () => {
    setDialogType('deposit')
    setIsDialogOpen(true)
  }

  const openWithdrawal = () => {
    setDialogType('withdrawal')
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Total Tabungan Card (Ledger Sync) */}
      <div className="rounded-3xl border border-[#1C2538] bg-gradient-to-b from-[#141A2A] to-[#0E1320] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Akumulasi Saldo Tabungan
              </span>
              <Badge
                variant={activeGroup?.type === 'shared' ? 'shared' : 'personal'}
                className="text-[10px]"
              >
                {activeGroup?.type || 'Personal'}
              </Badge>
            </div>

            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
              {formatRupiah(totalBalance)}
            </div>

            <p className="text-xs text-slate-400">
              Saldo otomatis terakumulasi dari seluruh target tabungan aktif di workspace ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAiQuickAddOpen(true)}
              className="flex-1 sm:flex-initial min-h-[44px] border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-white shadow-sm transition-all"
              title="Catat transaksi cepat dengan kalimat santai bertenaga AI"
            >
              <Sparkles className="h-4 w-4 mr-1.5 text-amber-400" />
              <span>⚡ Quick-Add AI</span>
            </Button>

            <Button
              variant="deposit"
              size="md"
              onClick={openDeposit}
              className="flex-1 sm:flex-initial min-h-[44px]"
            >
              <ArrowDownLeft className="h-4 w-4 mr-1" />
              <span>+ Setor</span>
            </Button>

            <Button
              variant="destructive"
              size="md"
              onClick={openWithdrawal}
              className="flex-1 sm:flex-initial min-h-[44px]"
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>- Tarik</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Ringkasan Mini Metrik Finansial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-blue-400" />
              Target Finansial
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {formatRupiah(totalTarget)}
            </div>
            <p className="text-[11px] text-slate-500">
              Total {goals.length} target terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
              Total Setoran
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {formatRupiah(totalDeposit)}
            </div>
            <p className="text-[11px] text-slate-500">
              Akumulasi setoran masuk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-400" />
              Total Penarikan
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
              {formatRupiah(totalWithdrawal)}
            </div>
            <p className="text-[11px] text-slate-500">
              Akumulasi penarikan keluar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Target Tercapai
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
              {achievedGoalsCount} / {goals.length}
            </div>
            <p className="text-[11px] text-slate-500">
              {activeGoalsCount} target masih berjalan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Progress Akumulasi Tabungan Keseluruhan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Pencapaian Akumulasi Ruang Tabungan</span>
              </CardTitle>
              <CardDescription>
                Progres pengumpulan dana terhadap seluruh target aktif di ruang tabungan ini.
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {visualProgress}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={visualProgress} variant="emerald" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Terkumpul: {formatRupiah(totalBalance)}</span>
            <span>Target Total: {formatRupiah(totalTarget)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Transaksi Terbaru (Recent Transactions) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Mutasi Transaksi Terbaru
            </h3>
          </div>
          <Link
            href="/transactions"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1C2538] bg-[#101522]/50 p-6 text-center text-xs text-slate-400">
            Belum ada transaksi di workspace ini.{' '}
            <button
              type="button"
              onClick={openDeposit}
              className="text-emerald-400 underline font-medium hover:text-emerald-300 ml-1"
            >
              Catat setoran pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const isDeposit = tx.type === 'deposit'
              return (
                <div
                  key={tx.id}
                  className="rounded-xl border border-[#1C2538] bg-[#101522] p-3 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        isDeposit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {tx.goals?.name || 'Target Tabungan'}
                        </span>
                        {tx.categories && (
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1.5"
                            style={{
                              borderColor: `${tx.categories.color}40`,
                              color: tx.categories.color || '#3B82F6',
                            }}
                          >
                            {tx.categories.name}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {tx.notes || (isDeposit ? 'Setoran Tabungan' : 'Penarikan Dana')} •{' '}
                        {formatDate(tx.transaction_date)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`text-sm font-bold font-mono shrink-0 ${
                      isDeposit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isDeposit ? '+ ' : '- '}
                    {formatRupiah(Number(tx.amount) || 0)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Smart Quick-Add AI */}
      <SmartQuickAddModal
        isOpen={isAiQuickAddOpen}
        onClose={() => setIsAiQuickAddOpen(false)}
        onSuccess={() => setRefreshTrigger((c) => c + 1)}
        onOpenFullForm={(prefilled) => {
          setFullFormPrefill(prefilled)
          setDialogType(prefilled.type)
          setIsDialogOpen(true)
        }}
      />

      {/* Modal Dialog Transaksi Standar */}
      <CreateTransactionDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setFullFormPrefill(null)
        }}
        defaultType={dialogType}
        defaultGoalId={fullFormPrefill?.goalId}
        defaultCategoryId={fullFormPrefill?.categoryId}
        defaultAmount={fullFormPrefill?.amount}
        defaultNotes={fullFormPrefill?.notes}
        onSuccess={() => setRefreshTrigger((c) => c + 1)}
      />
    </div>
  )
}
