'use client'

import * as React from 'react'
import { Target, AlertCircle } from 'lucide-react'
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
import { createGoalAction } from '@/actions/goals'
import { useWorkspace } from '@/components/groups/workspace-context'
import type { Goal } from '@/types/database'

export interface CreateGoalDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (goal: Goal) => void
}

export function CreateGoalDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateGoalDialogProps) {
  const { activeGroupId, activeGroup } = useWorkspace()

  const [name, setName] = React.useState('')
  const [targetAmountRaw, setTargetAmountRaw] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [deadline, setDeadline] = React.useState('')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Parse numeric value safely
  const numericAmount = React.useMemo(() => {
    const clean = targetAmountRaw.replace(/\D/g, '')
    return clean ? parseInt(clean, 10) : 0
  }, [targetAmountRaw])

  const handleClose = () => {
    if (isLoading) return
    setName('')
    setTargetAmountRaw('')
    setDescription('')
    setDeadline('')
    setErrorMsg(null)
    onClose()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const val = e.target.value.replace(/\D/g, '')
    setTargetAmountRaw(val)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMsg('Nama target tabungan wajib diisi.')
      return
    }

    if (trimmedName.length > 100) {
      setErrorMsg('Nama target tabungan maksimal 100 karakter.')
      return
    }

    if (numericAmount <= 0) {
      setErrorMsg('Target nominal tabungan harus lebih besar dari Rp0.')
      return
    }

    if (numericAmount > 999999999999) {
      setErrorMsg('Target nominal tabungan melebihi batas yang diizinkan.')
      return
    }

    if (!activeGroupId) {
      setErrorMsg('Workspace aktif tidak ditemukan. Silakan pilih workspace.')
      return
    }

    setIsLoading(true)

    try {
      const result = await createGoalAction({
        workspaceId: activeGroupId,
        name: trimmedName,
        targetAmount: numericAmount,
        description: description.trim() || null,
        deadline: deadline || null,
      })

      if (!result.success) {
        setErrorMsg(result.error)
        setIsLoading(false)
        return
      }

      onSuccess?.(result.goal)
      handleClose()
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi saat membuat target tabungan.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Target className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {activeGroup?.name || 'Ruang Tabungan'}
            </span>
          </div>
          <DialogTitle>Buat Target Tabungan Baru</DialogTitle>
          <DialogDescription>
            Tetapkan target finansial yang ingin dicapai bersama atau mandiri di workspace ini.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Input Nama Target */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-name" requiredIndicator>
              Nama Target
            </Label>
            <Input
              id="goal-name"
              placeholder="Contoh: Liburan Bali / Dana Darurat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              maxLength={100}
              autoFocus
              error={Boolean(errorMsg && !name.trim())}
            />
          </div>

          {/* Input Target Nominal */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-target-amount" requiredIndicator>
              Target Nominal (Rp)
            </Label>
            <Input
              id="goal-target-amount"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 10000000"
              value={targetAmountRaw}
              onChange={handleAmountChange}
              disabled={isLoading}
              error={Boolean(errorMsg && numericAmount <= 0)}
            />
            {numericAmount > 0 && (
              <p className="text-xs font-semibold text-emerald-400 font-mono">
                {formatRupiah(numericAmount)}
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              Jumlah dana total yang ingin dikumpulkan.
            </p>
          </div>

          {/* Optional: Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-description">
              Catatan / Deskripsi (Opsional)
            </Label>
            <Input
              id="goal-description"
              placeholder="Contoh: Target tercapai sebelum akhir tahun"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          {/* Optional: Tanggal Deadline */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-deadline">
              Target Waktu / Deadline (Opsional)
            </Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
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
            variant="primary"
            isLoading={isLoading}
            disabled={!name.trim() || numericAmount <= 0}
          >
            Simpan Target
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
