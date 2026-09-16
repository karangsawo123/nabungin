'use client'

import * as React from 'react'
import { ChevronDown, Check, Plus, Users, User } from 'lucide-react'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown'
import { Badge } from '@/components/ui/badge'
import type { Group, MemberRole } from '@/types/database'

export interface WorkspaceMembership {
  role: MemberRole
  groups: Group | null
}

export interface WorkspaceSwitcherProps {
  memberships: WorkspaceMembership[]
  activeGroupId?: string
  onSelectGroup?: (groupId: string) => void
}

export function WorkspaceSwitcher({
  memberships,
  activeGroupId,
  onSelectGroup,
}: WorkspaceSwitcherProps) {
  // Default to first group or activeGroupId
  const activeMembership =
    memberships.find((m) => m.groups?.id === activeGroupId) || memberships[0]
  const activeGroup = activeMembership?.groups

  return (
    <Dropdown
      align="left"
      trigger={
        <div className="flex items-center gap-2.5 rounded-xl border border-[#1C2538] bg-[#161C2C] px-3 py-1.5 transition-colors hover:border-[#2A3650] hover:bg-[#1C2438]">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
            {activeGroup?.type === 'shared' ? (
              <Users className="h-3.5 w-3.5" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white max-w-[120px] sm:max-w-[160px] truncate">
                {activeGroup?.name || 'Pilih Workspace'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
          </div>
        </div>
      }
    >
      <div className="px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Ruang Tabungan
        </p>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {memberships.map((m) => {
          if (!m.groups) return null
          const isSelected = m.groups.id === activeGroup?.id

          return (
            <DropdownItem
              key={m.groups.id}
              onClick={() => onSelectGroup?.(m.groups!.id)}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300">
                  {m.groups.type === 'shared' ? (
                    <Users className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-200">
                    {m.groups.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge
                  variant={m.groups.type === 'shared' ? 'shared' : 'personal'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {m.groups.type}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-slate-400"
                >
                  {m.role}
                </Badge>
                {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
            </DropdownItem>
          )
        })}
      </div>

      <DropdownDivider />

      <DropdownItem
        onClick={() => alert('Fitur buat grup akan hadir di modul Workspace (V2)')}
        className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Buat Ruang Tabungan Baru</span>
      </DropdownItem>
    </Dropdown>
  )
}
