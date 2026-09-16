'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Users, Shield, UserMinus, LogOut, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkspace } from '@/components/groups/workspace-context'
import {
  getWorkspaceMembersAction,
  removeMemberAction,
  leaveWorkspaceAction,
  type MemberWithProfile,
} from '@/actions/collaboration'
import { formatDate } from '@/lib/utils'

export function MemberList() {
  const router = useRouter()
  const { activeGroupId, isOwner, isPersonal } = useWorkspace()

  const [members, setMembers] = React.useState<MemberWithProfile[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [processingId, setProcessingId] = React.useState<string | null>(null)

  const fetchMembers = React.useCallback(async (workspaceId: string) => {
    setIsLoading(true)
    setActionError(null)
    try {
      const data = await getWorkspaceMembersAction(workspaceId)
      setMembers(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeGroupId) {
      fetchMembers(activeGroupId)
    }
  }, [activeGroupId, fetchMembers])

  const handleRemove = async (userId: string, userName: string) => {
    if (!activeGroupId) return
    if (!confirm(`Yakin ingin mengeluarkan "${userName}" dari ruang tabungan ini?`)) {
      return
    }

    setProcessingId(userId)
    setActionError(null)

    try {
      const res = await removeMemberAction(activeGroupId, userId)
      if (!res.success) {
        setActionError(res.error)
        return
      }
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    } finally {
      setProcessingId(null)
    }
  }

  const handleLeave = async () => {
    if (!activeGroupId) return
    if (!confirm('Yakin ingin meninggalkan ruang tabungan bersama ini?')) {
      return
    }

    setIsLoading(true)
    setActionError(null)

    try {
      const res = await leaveWorkspaceAction(activeGroupId)
      if (!res.success) {
        setActionError(res.error)
        setIsLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setActionError('Gagal meninggalkan workspace.')
      setIsLoading(false)
    }
  }

  if (isPersonal) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1C2538] bg-[#101522]/40 p-6 text-center text-xs text-slate-400">
        <Shield className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
        <h4 className="font-semibold text-white">Personal Workspace Terisolasi</h4>
        <p className="text-slate-400 mt-1 max-w-md mx-auto">
          Personal Workspace adalah ruang tabungan privat Anda. Tidak dapat menambahkan atau mengundang anggota lain ke ruang ini.
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Daftar Anggota Ruang Tabungan</span>
            </CardTitle>
            <CardDescription>
              Anggota yang memiliki akses untuk melihat, menyetor, dan memantau target di workspace ini.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-slate-400">
            {members.length} Anggota
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {actionError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center justify-between p-3 rounded-xl bg-[#161C2C]">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const name = m.profiles?.full_name || 'Pengguna Nabungin'
              const isItemOwner = m.role === 'owner'

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-[#1C2538] bg-[#101522]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={name} src={m.profiles?.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {name}
                        </span>
                        <Badge
                          variant={isItemOwner ? 'brand' : 'outline'}
                          className="text-[9px] uppercase font-semibold py-0"
                        >
                          {m.role}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Bergabung: {formatDate(m.joined_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Tombol Keluarkan untuk Owner (tidak bisa keluarkan diri sendiri) */}
                    {isOwner && !isItemOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(m.user_id, name)}
                        isLoading={processingId === m.user_id}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8"
                      >
                        <UserMinus className="h-3.5 w-3.5 mr-1" />
                        <span>Keluarkan</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tombol Keluar Mandiri jika User adalah Member */}
        {!isOwner && !isPersonal && (
          <div className="pt-4 border-t border-[#1C2538] flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              className="text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>Tinggalkan Ruang Tabungan</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
