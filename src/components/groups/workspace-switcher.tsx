'use client'

import * as React from 'react'
import { ChevronDown, Check, Plus, Users, User, Trash2 } from 'lucide-react'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown'
import { Badge } from '@/components/ui/badge'
import { CreateWorkspaceDialog } from '@/components/groups/create-workspace-dialog'
import { DeleteWorkspaceDialog } from '@/components/groups/delete-workspace-dialog'
import { useWorkspace } from '@/components/groups/workspace-context'

export function WorkspaceSwitcher() {
  const {
    memberships,
    activeGroup,
    activeRole,
    setActiveWorkspaceId,
  } = useWorkspace()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = React.useState<{
    id: string
    name: string
  } | null>(null)

  return (
    <>
      <Dropdown
        align="left"
        trigger={
          <div
            role="button"
            tabIndex={0}
            aria-label="Pilih Ruang Tabungan"
            className="flex h-10 min-h-[44px] items-center gap-2.5 rounded-xl border border-[#1C2538] bg-[#141A2A] px-3 py-1.5 transition-colors hover:border-[#2A3650] hover:bg-[#1A2236] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer select-none"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 shrink-0">
              {activeGroup?.type === 'shared' ? (
                <Users className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white max-w-[110px] sm:max-w-[150px] md:max-w-[180px] truncate">
                  {activeGroup?.name || 'Pilih Workspace'}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </div>
              <span className="text-[10px] text-slate-400 capitalize mt-0.5">
                {activeGroup?.type || 'Personal'} • {activeRole || 'Owner'}
              </span>
            </div>
          </div>
        }
      >
        <div className="px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Daftar Ruang Tabungan
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {memberships.map((m) => {
            if (!m.groups) return null
            const isSelected = m.groups.id === activeGroup?.id

            return (
              <DropdownItem
                key={m.groups.id}
                onClick={() => setActiveWorkspaceId(m.groups!.id)}
                className="justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-300">
                    {m.groups.type === 'shared' ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {m.groups.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant={m.groups.type === 'shared' ? 'shared' : 'personal'}
                    className="text-[9px] px-1.5 py-0 uppercase"
                  >
                    {m.groups.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 text-slate-400 uppercase"
                  >
                    {m.role}
                  </Badge>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-emerald-400 ml-0.5" />
                  )}
                  {m.groups.type === 'shared' && m.role === 'owner' && (
                    <button
                      type="button"
                      title={`Hapus ${m.groups.name}`}
                      aria-label={`Hapus ${m.groups.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setWorkspaceToDelete({
                          id: m.groups!.id,
                          name: m.groups!.name,
                        })
                      }}
                      className="p-1 -mr-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </DropdownItem>
            )
          })}
        </div>

        <DropdownDivider />

        <DropdownItem
          onClick={() => setIsDialogOpen(true)}
          className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
        >
          <Plus className="h-3.5 w-3.5 text-emerald-400" />
          <span>Buat Workspace Bersama</span>
        </DropdownItem>
      </Dropdown>

      {/* Modal Dialog Buat Workspace Bersama */}
      <CreateWorkspaceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {/* Modal Dialog Hapus Workspace */}
      <DeleteWorkspaceDialog
        isOpen={!!workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        workspace={workspaceToDelete}
      />
    </>
  )
}
