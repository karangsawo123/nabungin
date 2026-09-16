'use client'

import * as React from 'react'
import {
  UserPlus,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  createGroupInviteAction,
  getActiveInvitesAction,
  revokeGroupInviteAction,
} from '@/actions/collaboration'
import { useWorkspace } from '@/components/groups/workspace-context'
import { formatDate } from '@/lib/utils'
import type { GroupInvite } from '@/types/database'

export interface InviteMemberDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteMemberDialog({
  isOpen,
  onClose,
}: InviteMemberDialogProps) {
  const { activeGroupId, activeGroup } = useWorkspace()

  const [maxUses, setMaxUses] = React.useState(10)
  const [expiresInDays, setExpiresInDays] = React.useState(7)
  const [activeInvites, setActiveInvites] = React.useState<GroupInvite[]>([])
  const [createdInviteUrl, setCreatedInviteUrl] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && activeGroupId) {
      setErrorMsg(null)
      setCreatedInviteUrl(null)
      getActiveInvitesAction(activeGroupId).then(setActiveInvites)
    }
  }, [isOpen, activeGroupId])

  const handleCreateInvite = async () => {
    if (!activeGroupId) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await createGroupInviteAction({
        workspaceId: activeGroupId,
        maxUses,
        expiresInDays,
      })

      if (!res.success) {
        setErrorMsg(res.error)
        setIsLoading(false)
        return
      }

      const invite = res.data
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${origin}/invite/${invite.token}?workspace=${activeGroupId}`
      setCreatedInviteUrl(url)

      // Refresh list
      setActiveInvites((prev) => [invite, ...prev])
    } catch {
      setErrorMsg('Gagal membuat tautan undangan.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!createdInviteUrl) return
    navigator.clipboard.writeText(createdInviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async (inviteId: string) => {
    if (!activeGroupId) return
    const res = await revokeGroupInviteAction(inviteId, activeGroupId)
    if (res.success) {
      setActiveInvites((prev) => prev.filter((i) => i.id !== inviteId))
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <UserPlus className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {activeGroup?.name || 'Ruang Tabungan Bersama'}
            </span>
          </div>
          <DialogTitle>Undang Anggota Baru</DialogTitle>
          <DialogDescription>
            Bagikan tautan undangan terproteksi untuk mengajak pasangan, keluarga, atau teman menabung bersama.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Pembuatan Undangan Baru */}
        <div className="space-y-3 p-4 rounded-xl border border-[#1C2538] bg-[#0E1320]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Konfigurasi Tautan Undangan
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="max-uses">Batas Penggunaan</Label>
              <select
                id="max-uses"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-[#1C2538] bg-[#101522] px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value={1}>1 kali pakai</option>
                <option value={5}>5 kali pakai</option>
                <option value={10}>10 kali pakai</option>
                <option value={50}>50 kali pakai</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="expires-in">Masa Berlaku</Label>
              <select
                id="expires-in"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-[#1C2538] bg-[#101522] px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value={1}>1 Hari</option>
                <option value={3}>3 Hari</option>
                <option value={7}>7 Hari (1 Minggu)</option>
                <option value={30}>30 Hari (1 Bulan)</option>
              </select>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCreateInvite}
            isLoading={isLoading}
            className="w-full mt-2"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            <span>Generate Tautan Undangan</span>
          </Button>
        </div>

        {/* Tautan yang baru di-generate */}
        {createdInviteUrl && (
          <div className="space-y-2 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <span className="text-xs font-semibold text-emerald-400 block">
              Tautan Undangan Berhasil Dibuat:
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdInviteUrl}
                className="flex-1 h-9 rounded-lg border border-[#1C2538] bg-[#090D16] px-2.5 text-xs text-slate-200 font-mono select-all focus:outline-none"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 h-9"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    <span>Salin</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Daftar Tautan Aktif */}
        <div className="space-y-2 pt-2 border-t border-[#1C2538]">
          <span className="text-xs font-semibold text-slate-400 block">
            Undangan Aktif ({activeInvites.length})
          </span>

          {activeInvites.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              Belum ada tautan undangan aktif untuk ruang ini.
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {activeInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#141A2A] border border-[#1C2538] text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] py-0">
                        {inv.used_count} / {inv.max_uses} Terpakai
                      </Badge>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Kedaluwarsa: {formatDate(inv.expires_at)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(inv.id)}
                    title="Batalkan Undangan"
                    className="h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Selesai
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
