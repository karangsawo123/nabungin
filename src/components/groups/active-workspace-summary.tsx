'use client'

import * as React from 'react'
import { Users, User, Shield, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/components/groups/workspace-context'

export function ActiveWorkspaceSummary() {
  const { activeGroup, activeRole, isPersonal } = useWorkspace()

  if (!activeGroup) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#1C2538] bg-[#101522] p-4 text-xs text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span>Memuat informasi ruang tabungan aktif...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#1C2538] bg-[#101522] p-4 text-xs transition-all">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {isPersonal ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white text-sm truncate max-w-[200px] sm:max-w-[300px]">
              {activeGroup.name}
            </span>
            <Badge
              variant={isPersonal ? 'personal' : 'shared'}
              className="text-[10px] uppercase font-semibold"
            >
              {isPersonal ? 'Personal' : 'Shared'}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] text-slate-300 font-medium"
            >
              <Shield className="h-2.5 w-2.5 mr-1 text-emerald-400" />
              Role: <span className="capitalize font-semibold text-white ml-0.5">{activeRole || 'Owner'}</span>
            </Badge>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {isPersonal
              ? 'Ruang tabungan pribadi otomatis. Target dan pos alokasi terisolasi untuk Anda.'
              : 'Ruang tabungan bersama. Anggota workspace dapat berkolaborasi mencapai target.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0 self-end sm:self-center">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aktif
        </span>
        <span className="text-slate-600">•</span>
        <span className="font-mono text-slate-400">
          ID: {activeGroup.id.slice(0, 8)}
        </span>
      </div>
    </div>
  )
}
