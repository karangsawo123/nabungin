'use client'

import * as React from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, AlertCircle } from 'lucide-react'
import { createSharedWorkspaceAction } from '@/actions/workspaces'
import { useWorkspace } from '@/components/groups/workspace-context'

export interface CreateWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateWorkspaceDialog({
  isOpen,
  onClose,
}: CreateWorkspaceDialogProps) {
  const { addWorkspace, setActiveWorkspaceId } = useWorkspace()
  const [name, setName] = React.useState('')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleClose = () => {
    if (isLoading) return
    setName('')
    setErrorMsg(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmed = name.trim()
    if (!trimmed) {
      setErrorMsg('Nama ruang tabungan wajib diisi.')
      return
    }

    if (trimmed.length > 50) {
      setErrorMsg('Nama ruang tabungan maksimal 50 karakter.')
      return
    }

    setIsLoading(true)

    try {
      const result = await createSharedWorkspaceAction(trimmed)

      if (!result.success) {
        setErrorMsg(result.error)
        setIsLoading(false)
        return
      }

      // Berhasil: update context client, set active, dan tutup modal
      addWorkspace(result.group, result.role)
      await setActiveWorkspaceId(result.group.id)
      handleClose()
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Users className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Workspace Bersama
            </span>
          </div>
          <DialogTitle>Buat Ruang Tabungan Baru</DialogTitle>
          <DialogDescription>
            Buat ruang kolaboratif baru untuk menabung bersama pasangan, keluarga, atau teman.
            Kamu otomatis menjadi <span className="text-emerald-400 font-medium">Owner</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="workspace-name" requiredIndicator>
              Nama Ruang Tabungan
            </Label>
            <Input
              id="workspace-name"
              placeholder="Contoh: Tabungan Nikah / Liburan Bali"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              maxLength={50}
              autoFocus
              error={Boolean(errorMsg)}
            />
            <p className="text-[11px] text-slate-500">
              Maksimal 50 karakter. Nama dapat diubah kembali nanti oleh owner.
            </p>
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
            disabled={!name.trim()}
          >
            Buat Workspace
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
