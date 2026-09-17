'use client'

import * as React from 'react'
import { ArrowDownLeft, ArrowUpRight, AlertCircle, Wallet } from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatRupiah } from '@/lib/utils'
import { createTransactionAction } from '@/actions/transactions'
import { getGoalsByWorkspace } from '@/actions/goals'
import { getCategoriesByWorkspace } from '@/actions/categories'
import { useWorkspace } from '@/components/groups/workspace-context'
import type { Goal, Category, Transaction, TransactionType } from '@/types/database'

export interface CreateTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
  defaultType?: TransactionType
  defaultGoalId?: string
  defaultCategoryId?: string
  defaultAmount?: number
  defaultNotes?: string
  onSuccess?: (transaction: Transaction) => void
}

export function CreateTransactionDialog({
  isOpen,
  onClose,
  defaultType = 'deposit',
  defaultGoalId,
  defaultCategoryId,
  defaultAmount,
  defaultNotes,
  onSuccess,
}: CreateTransactionDialogProps) {
  const { activeGroupId, activeGroup, triggerRefresh } = useWorkspace()

  const [type, setType] = React.useState<TransactionType>(defaultType)
  const [goalId, setGoalId] = React.useState(defaultGoalId || '')
  const [categoryId, setCategoryId] = React.useState(defaultCategoryId || '')
  const [amountRaw, setAmountRaw] = React.useState(
    defaultAmount ? defaultAmount.toString() : ''
  )
  const [notes, setNotes] = React.useState(defaultNotes || '')
  const [txDate, setTxDate] = React.useState(
    new Date().toISOString().split('T')[0]
  )

  const [goals, setGoals] = React.useState<Goal[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Muat daftar goals & categories saat dialog dibuka
  React.useEffect(() => {
    if (isOpen && activeGroupId) {
      setType(defaultType)
      if (defaultGoalId) setGoalId(defaultGoalId)
      if (defaultCategoryId) setCategoryId(defaultCategoryId)
      if (defaultAmount) setAmountRaw(defaultAmount.toString())
      if (defaultNotes) setNotes(defaultNotes)

      Promise.all([
        getGoalsByWorkspace(activeGroupId),
        getCategoriesByWorkspace(activeGroupId),
      ]).then(([goalsData, catsData]) => {
        setGoals(goalsData)
        setCategories(catsData)
        if (!defaultGoalId && goalsData.length > 0) {
          setGoalId(goalsData[0].id)
        }
        if (!defaultCategoryId && catsData.length > 0) {
          setCategoryId(catsData[0].id)
        }
      })
    }
  }, [
    isOpen,
    activeGroupId,
    defaultType,
    defaultGoalId,
    defaultCategoryId,
    defaultAmount,
    defaultNotes,
  ])

  const numericAmount = React.useMemo(() => {
    const clean = amountRaw.replace(/\D/g, '')
    return clean ? parseInt(clean, 10) : 0
  }, [amountRaw])

  const selectedGoal = goals.find((g) => g.id === goalId)
  const availableBalance = Number(selectedGoal?.current_amount) || 0

  const handleClose = () => {
    if (isLoading) return
    setAmountRaw('')
    setNotes('')
    setErrorMsg(null)
    onClose()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setAmountRaw(val)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    if (numericAmount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih besar dari Rp0.')
      return
    }

    if (!goalId) {
      setErrorMsg('Pilih target tabungan tujuan.')
      return
    }

    if (!categoryId) {
      setErrorMsg('Pilih kategori pos alokasi.')
      return
    }

    if (type === 'withdrawal' && numericAmount > availableBalance) {
      setErrorMsg(
        `Saldo target tabungan tidak mencukupi untuk penarikan ini. Saldo saat ini: ${formatRupiah(
          availableBalance
        )}.`
      )
      return
    }

    if (!activeGroupId) {
      setErrorMsg('Workspace aktif tidak ditemukan.')
      return
    }

    setIsLoading(true)

    try {
      const result = await createTransactionAction({
        workspaceId: activeGroupId,
        goalId,
        categoryId,
        type,
        amount: numericAmount,
        notes: notes.trim() || null,
        transactionDate: txDate,
      })

      if (!result.success) {
        setErrorMsg(result.error)
        setIsLoading(false)
        return
      }

      triggerRefresh()
      onSuccess?.(result.transaction)
      handleClose()
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi saat mencatat transaksi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {activeGroup?.name || 'Ruang Tabungan'}
            </span>
          </div>
          <DialogTitle>Catat Mutasi Tabungan</DialogTitle>
          <DialogDescription>
            Pencatatan setoran atau penarikan yang langsung menyinkronkan saldo ledger target.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Tipe Transaksi: Deposit vs Withdrawal Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#090D16] border border-[#1C2538] rounded-xl">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'deposit'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>+ Setor (Deposit)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('withdrawal')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                type === 'withdrawal'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>- Tarik (Withdrawal)</span>
            </button>
          </div>

          {/* Pilih Target Tabungan (Goal) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tx-goal-id" requiredIndicator>
                Target Tabungan (Goal)
              </Label>
              {selectedGoal && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Saldo: <strong className="text-white">{formatRupiah(availableBalance)}</strong>
                </span>
              )}
            </div>
            <select
              id="tx-goal-id"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              disabled={isLoading}
              className="w-full h-10 rounded-xl border border-[#1C2538] bg-[#101522] px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {goals.length === 0 ? (
                <option value="">Belum ada target tabungan</option>
              ) : (
                goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — Saldo: {formatRupiah(Number(g.current_amount) || 0)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Pilih Kategori Pos Alokasi */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-category-id" requiredIndicator>
              Kategori Pos Alokasi
            </Label>
            <select
              id="tx-category-id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isLoading}
              className="w-full h-10 rounded-xl border border-[#1C2538] bg-[#101522] px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {categories.length === 0 ? (
                <option value="">Belum ada kategori pos</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Input Nominal Transaksi */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-amount" requiredIndicator>
              Nominal Transaksi (Rp)
            </Label>
            <Input
              id="tx-amount"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 500000"
              value={amountRaw}
              onChange={handleAmountChange}
              disabled={isLoading}
              autoFocus
            />
            {numericAmount > 0 && (
              <p
                className={`text-xs font-semibold font-mono ${
                  type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {type === 'deposit' ? '+ ' : '- '}
                {formatRupiah(numericAmount)}
              </p>
            )}
          </div>

          {/* Catatan Transaksi */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-notes">Catatan / Keterangan (Opsional)</Label>
            <Input
              id="tx-notes"
              placeholder="Contoh: Setoran gaji ke-13 / Pengalihan dana"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              maxLength={200}
            />
          </div>

          {/* Tanggal Transaksi */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-date">Tanggal Transaksi</Label>
            <Input
              id="tx-date"
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              disabled={isLoading}
              className="text-slate-300"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant={type === 'deposit' ? 'primary' : 'destructive'}
            isLoading={isLoading}
            disabled={numericAmount <= 0 || !goalId || !categoryId}
          >
            {type === 'deposit' ? 'Konfirmasi Setoran' : 'Konfirmasi Penarikan'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
