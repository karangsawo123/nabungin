'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  ArrowLeftRight,
  Tags,
  Users,
  Wallet,
} from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { formatDisplayUsername } from '@/lib/auth-helpers'

export interface SidebarProps {
  profile?: Profile | null
  email?: string
}

export function Sidebar({ profile, email }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      label: 'Tabungan / Goals',
      href: '/goals',
      icon: Target,
      active: pathname.startsWith('/goals'),
    },
    {
      label: 'Transaksi',
      href: '/transactions',
      icon: ArrowLeftRight,
      active: pathname.startsWith('/transactions'),
    },
    {
      label: 'Kategori Pos',
      href: '/categories',
      icon: Tags,
      active: pathname.startsWith('/categories'),
    },
    {
      label: 'Ruang Kolaborasi',
      href: '/groups',
      icon: Users,
      active: pathname.startsWith('/groups'),
    },
  ]

  const displayHandle = formatDisplayUsername(email)
  const displayName = profile?.full_name || displayHandle || 'Pengguna'

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-[#101522] border-r border-[#1C2538]">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-[#1C2538]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-white tracking-tight">
            Nabungin
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
            Financial Studio
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navigasi Utama
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                item.active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-[#161C2C] hover:text-slate-200'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    item.active
                      ? 'text-emerald-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-[#1C2538] bg-[#0C101A]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={displayName} src={profile?.avatar_url} size="sm" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-white truncate">
              {displayName}
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {displayHandle}
            </span>
          </div>
        </div>
        <div className="w-full">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
