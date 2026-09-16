'use client'

import * as React from 'react'
import { UserPlus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MemberList } from '@/components/collaboration/member-list'
import { InviteMemberDialog } from '@/components/collaboration/invite-member-dialog'
import { ActivityTimeline } from '@/components/activity/activity-timeline'
import { useWorkspace } from '@/components/groups/workspace-context'

export default function GroupsPage() {
  const { activeGroup, activeRole, isOwner, isPersonal } = useWorkspace()
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1C2538] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Ruang Kolaborasi
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400 capitalize">
              Peran Anda: {activeRole || 'Member'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {activeGroup?.name || 'Ruang Tabungan'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isPersonal
              ? 'Ruang tabungan personal Anda terlindungi secara privat.'
              : 'Kelola anggota, hak akses, dan tautan undangan kolaborasi bersama.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isOwner && !isPersonal && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsInviteOpen(true)}
              className="min-h-[44px]"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              <span>Undang Anggota</span>
            </Button>
          )}

          <Badge
            variant={isPersonal ? 'personal' : 'shared'}
            className="py-1 px-3 uppercase text-xs font-semibold"
          >
            {activeGroup?.type} Workspace
          </Badge>
        </div>
      </div>

      {/* 2. Informasi Peraturan Kolaborasi */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 flex items-start gap-3.5 text-xs text-blue-200">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white block">
            Prinsip Kolaborasi & Keamanan Nabungin
          </span>
          <p className="text-slate-300 leading-relaxed">
            {isPersonal
              ? 'Personal Workspace dibuat otomatis saat registrasi dan terisolasi untuk data Anda saja. Untuk menabung bersama pasangan atau teman, Anda dapat membuat "Shared Workspace" baru dari Workspace Switcher di atas.'
              : 'Seluruh anggota Shared Workspace dapat memantau progres target tabungan dan mencatat mutasi setoran. Hanya Owner yang berhak mengundang, membatalkan undangan, dan mengeluarkan anggota.'}
          </p>
        </div>
      </div>

      {/* 3. Daftar Anggota & Manajemen */}
      <MemberList />

      {/* 4. Lini Masa Aktivitas Ruang Tabungan */}
      {activeGroup && (
        <div className="pt-2">
          <ActivityTimeline workspaceId={activeGroup.id} />
        </div>
      )}

      {/* Modal Dialog Undang Anggota */}
      <InviteMemberDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  )
}
