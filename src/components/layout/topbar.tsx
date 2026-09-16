'use client'

import * as React from 'react'
import { Wallet } from 'lucide-react'
import { WorkspaceSwitcher } from '@/components/groups/workspace-switcher'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'
import { formatDisplayUsername } from '@/lib/auth-helpers'

export interface TopbarProps {
  profile?: Profile | null
  email?: string
}

export function Topbar({ profile, email }: TopbarProps) {
  const displayName = profile?.full_name || formatDisplayUsername(email) || 'Pengguna'

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
        <WorkspaceSwitcher />
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

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
