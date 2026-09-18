'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
import { AlertTriangle, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react'
import { deleteWorkspaceAction } from '@/actions/workspaces'
import { useWorkspace } from '@/components/groups/workspace-context'

export interface DeleteWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  workspace: {
    id: string
    name: string
  } | null
  onSuccess?: () => void
}

export function DeleteWorkspaceDialog({
  isOpen,
  onClose,
  workspace,
  onSuccess,
}: DeleteWorkspaceDialogProps) {
  const router = useRouter()
  const { removeWorkspace, activeGroupId } = useWorkspace()
  const [confirmName, setConfirmName] = React.useState('')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const isMatch =
    workspace && confirmName.trim().toLowerCase() === workspace.name.trim().toLowerCase()

  const handleClose = () => {
    if (isLoading) return
    setConfirmName('')
    setErrorMsg(null)
    onClose()
  }

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!workspace || !isMatch || isLoading) return

    setErrorMsg(null)
    setIsLoading(true)

    try {
      const result = await deleteWorkspaceAction(workspace.id)

      if (!result.success) {
        setErrorMsg(result.error)
        setIsLoading(false)
        return
      }

      // Hapus dari state context klien dan alihkan workspace aktif jika perlu
      const wasActive = activeGroupId === workspace.id
      removeWorkspace(workspace.id, result.fallbackWorkspaceId)

      handleClose()

      if (onSuccess) {
        onSuccess()
      }

      // Jika workspace yang dihapus adalah workspace yang sedang dibuka, arahkan ke dashboard
      if (wasActive) {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setErrorMsg('Terjadi kendala jaringan saat menghapus ruang tabungan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!workspace) return null

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleDelete}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Zona Berbahaya
            </span>
          </div>
          <DialogTitle className="text-white text-lg">
            Hapus Ruang Tabungan
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs sm:text-sm">
            Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2 text-xs">
          {/* Kotak Rincian Konsekuensi */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2 text-slate-300">
            <p className="font-semibold text-rose-300">
              Menghapus &quot;{workspace.name}&quot; akan menghapus secara permanen:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Seluruh target tabungan (Goals) & catatan mutasi setoran/penarikan</li>
              <li>Seluruh kategori pos tabungan yang terdaftar di ruang ini</li>
              <li>Riwayat aktivitas kolaborasi dan tautan undangan aktif</li>
              <li>Akses dan keterhubungan seluruh anggota ruang tabungan</li>
            </ul>
          </div>

          {/* Konfirmasi Pengetikan Nama */}
          <div className="space-y-2 pt-1">
            <Label htmlFor="confirm-workspace-name" requiredIndicator className="text-slate-200">
              Ketik <span className="font-semibold text-rose-400 select-all">&quot;{workspace.name}&quot;</span> untuk mengonfirmasi:
            </Label>
            <div className="relative">
              <Input
                id="confirm-workspace-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={workspace.name}
                disabled={isLoading}
                autoFocus
                autoComplete="off"
                className="pr-9 border-slate-700 focus:border-rose-500 focus:ring-rose-500/30"
              />
              {isMatch && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Tombol hapus akan aktif setelah teks yang diketik sesuai dengan nama ruang tabungan.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleClose}
            disabled={isLoading}
            className="min-h-[42px]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="md"
            disabled={!isMatch || isLoading}
            isLoading={isLoading}
            className="min-h-[42px]"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span>Hapus Ruang Tabungan</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
