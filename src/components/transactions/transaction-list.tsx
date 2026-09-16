'use client'

import * as React from 'react'
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Plus,
  Minus,
  Sparkles,
  Calendar,
  User,
  Download,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { CreateTransactionDialog } from '@/components/transactions/create-transaction-dialog'
import { useWorkspace } from '@/components/groups/workspace-context'
import {
  getTransactionsByWorkspace,
  type TransactionWithDetails,
} from '@/actions/transactions'
import { exportTransactionsCsvAction } from '@/actions/export'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { TransactionType } from '@/types/database'

export interface TransactionListProps {
  initialTransactions?: TransactionWithDetails[]
  initialWorkspaceId?: string
}

export function TransactionList({
  initialTransactions = [],
  initialWorkspaceId,
}: TransactionListProps) {
  const { activeGroupId, activeGroup, refreshKey } = useWorkspace()

  const [prevWorkspaceId, setPrevWorkspaceId] = React.useState(activeGroupId)
  const [transactions, setTransactions] = React.useState<TransactionWithDetails[]>(() => {
    return initialWorkspaceId === activeGroupId ? initialTransactions : []
  })
  const [isLoading, setIsLoading] = React.useState(
    !initialWorkspaceId || initialWorkspaceId !== activeGroupId
  )
  const [error, setError] = React.useState<string | null>(null)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [dialogType, setDialogType] = React.useState<TransactionType>('deposit')
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  // Filters State
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterType, setFilterType] = React.useState<'all' | 'deposit' | 'withdrawal'>('all')

  React.useEffect(() => {
    const handleGlobalRefresh = () => {
      setRefreshTrigger((c) => c + 1)
    }
    window.addEventListener('nabungin:refresh', handleGlobalRefresh)
    return () => {
      window.removeEventListener('nabungin:refresh', handleGlobalRefresh)
    }
  }, [])

  if (prevWorkspaceId !== activeGroupId) {
    setPrevWorkspaceId(activeGroupId)
    if (activeGroupId === initialWorkspaceId) {
      setTransactions(initialTransactions)
      setIsLoading(false)
    } else {
      setIsLoading(true)
      setTransactions([])
    }
    setError(null)
  }

  React.useEffect(() => {
    let isCancelled = false
    if (!activeGroupId) return

    if (
      activeGroupId === initialWorkspaceId &&
      initialTransactions.length > 0 &&
      refreshTrigger === 0 &&
      refreshKey === 0
    ) {
      return
    }

    getTransactionsByWorkspace(activeGroupId)
      .then((data) => {
        if (!isCancelled) {
          setTransactions(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError('Gagal memuat riwayat transaksi. Silakan coba lagi.')
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [activeGroupId, initialWorkspaceId, initialTransactions.length, refreshTrigger, refreshKey])

  const openDeposit = () => {
    setDialogType('deposit')
    setIsDialogOpen(true)
  }

  const openWithdrawal = () => {
    setDialogType('withdrawal')
    setIsDialogOpen(true)
  }

  const [isExporting, setIsExporting] = React.useState(false)

  const handleTransactionSuccess = () => {
    setRefreshTrigger((c) => c + 1)
  }

  const handleExportCsv = async () => {
    if (!activeGroupId) return
    try {
      setIsExporting(true)
      const res = await exportTransactionsCsvAction(activeGroupId, {
        type: filterType === 'all' ? undefined : filterType,
      })
      if (!res.success || !res.csvData) {
        alert(res.error || 'Gagal mengekspor data.')
        return
      }

      const blob = new Blob([res.csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', res.filename || 'transaksi.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      alert('Gagal mengekspor data transaksi.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrintPdf = () => {
    window.print()
  }

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      tx.notes?.toLowerCase().includes(q) ||
      tx.goals?.name.toLowerCase().includes(q) ||
      tx.categories?.name.toLowerCase().includes(q)
    )
  })

  // Agregasi Keuangan
  const totalDeposit = transactions
    .filter((tx) => tx.type === 'deposit')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

  const totalWithdrawal = transactions
    .filter((tx) => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

  const netSavings = totalDeposit - totalWithdrawal

  return (
    <div className="space-y-6">
      {/* 1. Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Mutasi Tabungan
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">
              {transactions.length} Transaksi Tercatat
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Riwayat Transaksi {activeGroup?.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export CSV Button */}
          <Button
            variant="outline"
            size="md"
            onClick={handleExportCsv}
            disabled={isExporting || transactions.length === 0}
            className="min-h-[44px]"
            title="Export riwayat transaksi ke CSV"
          >
            <Download className="h-4 w-4 mr-1.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </Button>

          {/* Print / PDF Button */}
          <Button
            variant="outline"
            size="md"
            onClick={handlePrintPdf}
            disabled={transactions.length === 0}
            className="min-h-[44px] hidden sm:inline-flex"
            title="Cetak atau simpan sebagai PDF"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            <span>Cetak / PDF</span>
          </Button>

          <Button
            variant="deposit"
            size="md"
            onClick={openDeposit}
            className="min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>+ Setor</span>
          </Button>

          <Button
            variant="destructive"
            size="md"
            onClick={openWithdrawal}
            className="min-h-[44px]"
          >
            <Minus className="h-4 w-4 mr-1.5" />
            <span>- Tarik</span>
          </Button>
        </div>
      </div>

      {/* 2. Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-[#101522] p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
            <span>Total Setoran (Deposit)</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
            {formatRupiah(totalDeposit)}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-[#101522] p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ArrowUpRight className="h-4 w-4 text-rose-400" />
            <span>Total Penarikan (Withdrawal)</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-400">
            {formatRupiah(totalWithdrawal)}
          </div>
        </div>

        <div className="rounded-2xl border border-[#1C2538] bg-[#101522] p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <ArrowLeftRight className="h-4 w-4 text-blue-400" />
            <span>Akumulasi Saldo Bersih</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {formatRupiah(netSavings)}
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101522] border border-[#1C2538] rounded-2xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari transaksi berdasarkan catatan atau target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-[#090D16]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Filter className="h-3.5 w-3.5 text-slate-500 mr-1 hidden sm:inline" />
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterType('deposit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'deposit'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Setoran (+)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('withdrawal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'withdrawal'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Penarikan (-)
          </button>
        </div>
      </div>

      {/* 4. Error State */}
      {error && (
        <ErrorState
          title="Gagal Memuat Transaksi"
          message={error}
          onRetry={() => setRefreshTrigger((c) => c + 1)}
        />
      )}

      {/* 5. Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-[#1C2538] bg-[#101522] p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* 6. Empty State */}
      {!isLoading && !error && filteredTransactions.length === 0 && (
        <EmptyState
          icon={ArrowLeftRight}
          title={
            transactions.length === 0
              ? 'Belum Ada Transaksi'
              : 'Tidak Ada Transaksi yang Cocok'
          }
          description={
            transactions.length === 0
              ? `Belum ada mutasi setoran atau penarikan di ruang tabungan "${activeGroup?.name || 'ini'}". Catat setoran pertama untuk mulai menabung.`
              : 'Coba ubah kata kunci pencarian atau filter tipe transaksi.'
          }
          action={
            transactions.length === 0 ? (
              <Button
                variant="deposit"
                size="md"
                onClick={openDeposit}
                className="min-h-[44px]"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Catat Setoran Pertama
              </Button>
            ) : undefined
          }
        />
      )}

      {/* 7. Transactions List Cards */}
      {!isLoading && !error && filteredTransactions.length > 0 && (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isDeposit = tx.type === 'deposit'
            const amountNum = Number(tx.amount) || 0

            return (
              <Card
                key={tx.id}
                className="transition-all duration-150 hover:border-[#2A3650] hover:bg-[#121828]"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isDeposit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white tracking-tight truncate">
                          {tx.goals?.name || 'Target Terhapus'}
                        </span>

                        {tx.categories && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-2 font-medium"
                            style={{
                              borderColor: `${tx.categories.color}40`,
                              backgroundColor: `${tx.categories.color}15`,
                              color: tx.categories.color || '#3B82F6',
                            }}
                          >
                            {tx.categories.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {tx.notes && (
                          <span className="truncate max-w-[240px] text-slate-300">
                            {tx.notes}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(tx.transaction_date)}
                        </span>

                        {tx.profiles && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <User className="h-3 w-3" />
                            {tx.profiles.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 self-end sm:self-center">
                    <div
                      className={`text-base sm:text-lg font-bold font-mono ${
                        isDeposit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isDeposit ? '+ ' : '- '}
                      {formatRupiah(amountNum)}
                    </div>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {isDeposit ? 'Setoran Masuk' : 'Penarikan Dana'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Dialog Transaksi */}
      <CreateTransactionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        defaultType={dialogType}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  )
}
