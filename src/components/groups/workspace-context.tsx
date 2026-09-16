'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { setActiveWorkspaceCookieAction } from '@/actions/workspaces'
import type { Group, MemberRole } from '@/types/database'

export interface WorkspaceMembership {
  role: MemberRole
  groups: Group | null
}

interface WorkspaceContextValue {
  memberships: WorkspaceMembership[]
  activeGroupId: string
  activeGroup: Group | null
  activeRole: MemberRole | null
  isOwner: boolean
  isPersonal: boolean
  setActiveWorkspaceId: (groupId: string) => Promise<void>
  addWorkspace: (group: Group, role: MemberRole) => void
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | undefined>(
  undefined
)

export interface WorkspaceProviderProps {
  initialMemberships: WorkspaceMembership[]
  initialActiveGroupId: string
  children: React.ReactNode
}

export function WorkspaceProvider({
  initialMemberships,
  initialActiveGroupId,
  children,
}: WorkspaceProviderProps) {
  const router = useRouter()
  const [prevMemberships, setPrevMemberships] = React.useState<WorkspaceMembership[]>(
    initialMemberships
  )
  const [memberships, setMemberships] = React.useState<WorkspaceMembership[]>(
    initialMemberships
  )

  if (prevMemberships !== initialMemberships) {
    setPrevMemberships(initialMemberships)
    setMemberships(initialMemberships)
  }

  const [prevActiveGroupId, setPrevActiveGroupId] = React.useState<string>(
    initialActiveGroupId
  )
  const [activeGroupId, setActiveGroupIdState] = React.useState<string>(
    initialActiveGroupId
  )

  if (prevActiveGroupId !== initialActiveGroupId) {
    setPrevActiveGroupId(initialActiveGroupId)
    setActiveGroupIdState(initialActiveGroupId)
  }

  // Cari membership aktif yang valid
  const activeMembership =
    memberships.find((m) => m.groups?.id === activeGroupId) ||
    memberships.find((m) => m.groups?.type === 'personal') ||
    memberships[0]

  const activeGroup = activeMembership?.groups || null
  const activeRole = activeMembership?.role || null
  const isOwner = activeRole === 'owner'
  const isPersonal = activeGroup?.type === 'personal'

  const setActiveWorkspaceId = React.useCallback(
    async (newGroupId: string) => {
      const target = memberships.find((m) => m.groups?.id === newGroupId)
      if (!target || !target.groups) return

      // Update state instan di client
      setActiveGroupIdState(newGroupId)

      // Set cookie di browser
      document.cookie = `active_workspace_id=${newGroupId}; path=/; max-age=31536000; SameSite=Lax`

      // Simpan ke cookie server-side via server action
      await setActiveWorkspaceCookieAction(newGroupId)

      // Refresh server components agar sinkron
      router.refresh()
    },
    [memberships, router]
  )

  const addWorkspace = React.useCallback((group: Group, role: MemberRole) => {
    setMemberships((prev) => [...prev, { role, groups: group }])
    setActiveGroupIdState(group.id)
  }, [])

  const value = React.useMemo(
    () => ({
      memberships,
      activeGroupId,
      activeGroup,
      activeRole,
      isOwner,
      isPersonal,
      setActiveWorkspaceId,
      addWorkspace,
    }),
    [
      memberships,
      activeGroupId,
      activeGroup,
      activeRole,
      isOwner,
      isPersonal,
      setActiveWorkspaceId,
      addWorkspace,
    ]
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace harus digunakan di dalam <WorkspaceProvider>')
  }
  return context
}
