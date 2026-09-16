'use client'

import * as React from 'react'
import { Edit3, AlertCircle } from 'lucide-react'
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
import { updateGoalAction } from '@/actions/goals'
import type { Goal } from '@/types/database'

export interface EditGoalDialogProps {
  isOpen: boolean
  onClose: () => void
  goal: Goal
  onSuccess?: (goal: Goal) => void
}

export function EditGoalDialog({
  isOpen,
  onClose,
  goal,
  onSuccess,
}: EditGoalDialogProps) {
  const [prevGoal, setPrevGoal] = React.useState(goal)
  const [name, setName] = React.useState(goal.name)
  const [targetAmountRaw, setTargetAmountRaw] = React.useState(
    String(Math.round(goal.target_amount))
  )
  const [description, setDescription] = React.useState(goal.description || '')
  const [deadline, setDeadline] = React.useState(goal.deadline || '')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Sinkronisasi form saat goal prop berubah (React recommended pattern)
  if (prevGoal.id !== goal.id || prevGoal.updated_at !== goal.updated_at) {
    setPrevGoal(goal)
    setName(goal.name)
    setTargetAmountRaw(String(Math.round(goal.target_amount)))
    setDescription(goal.description || '')
    setDeadline(goal.deadline || '')
    setErrorMsg(null)
  }

  const numericAmount = React.useMemo(() => {
    const clean = targetAmountRaw.replace(/\D/g, '')
    return clean ? parseInt(clean, 10) : 0
  }, [targetAmountRaw])

  const handleClose = () => {
    if (isLoading) return
    setErrorMsg(null)
    onClose()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsLoading(true)

    try {
      const result = await updateGoalAction({
        goalId: goal.id,
        workspaceId: goal.group_id,
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
      setErrorMsg('Terjadi kesalahan koneksi saat memperbarui target tabungan.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Edit3 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Edit Target Tabungan
            </span>
          </div>
          <DialogTitle>Ubah Informasi Target</DialogTitle>
          <DialogDescription>
            Perbarui nama target atau target nominal. Saldo saat ini tetap terjaga aman.
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
            <Label htmlFor="edit-goal-name" requiredIndicator>
              Nama Target
            </Label>
            <Input
              id="edit-goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              maxLength={100}
              error={Boolean(errorMsg && !name.trim())}
            />
          </div>

          {/* Input Target Nominal */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-goal-target-amount" requiredIndicator>
              Target Nominal (Rp)
            </Label>
            <Input
              id="edit-goal-target-amount"
              type="text"
              inputMode="numeric"
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
          </div>

          {/* Optional: Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-goal-description">
              Catatan / Deskripsi (Opsional)
            </Label>
            <Input
              id="edit-goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              maxLength={255}
            />
          </div>

          {/* Optional: Deadline */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-goal-deadline">
              Target Waktu / Deadline (Opsional)
            </Label>
            <Input
              id="edit-goal-deadline"
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
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
