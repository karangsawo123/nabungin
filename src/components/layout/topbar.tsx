'use client'

import * as React from 'react'
import { Bell, Wallet } from 'lucide-react'
import { WorkspaceSwitcher, type WorkspaceMembership } from '@/components/groups/workspace-switcher'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

export interface TopbarProps {
  profile?: Profile | null
  email?: string
  memberships: WorkspaceMembership[]
  activeGroupId?: string
  onSelectGroup?: (groupId: string) => void
}

export function Topbar({
  profile,
  email,
  memberships,
  activeGroupId,
  onSelectGroup,
}: TopbarProps) {
  const displayName = profile?.full_name || email || 'Pengguna'

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#1C2538] bg-[#090D16]/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Brand & Workspace Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Wallet className="h-4 w-4" />
          </div>
        </div>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher
          memberships={memberships}
          activeGroupId={activeGroupId}
          onSelectGroup={onSelectGroup}
        />
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Pemberitahuan"
          onClick={() => alert('Notifikasi realtime akan hadir di modul V2')}
          className="relative flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1C2538] bg-[#101522] text-slate-400 transition-colors hover:border-[#2A3650] hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {/* Unread indicator */}
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#090D16]" />
        </button>

        {/* Desktop Profile Pill */}
        <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-[#1C2538] bg-[#101522] p-1.5 pr-3">
          <Avatar name={displayName} src={profile?.avatar_url} size="sm" />
          <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  )
}
