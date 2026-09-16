import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoalList } from '@/components/goals/goal-list'
import type { Goal } from '@/types/database'

export const metadata = {
  title: 'Target Tabungan (Goals) — Nabungin',
  description: 'Kelola target dan rencana tabungan personal dan bersama di Nabungin.',
}

export default async function GoalsPage() {
  const supabase = await createClient()

  // 1. Verifikasi user terotentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Ambil active workspace ID dari cookie dan validasi membership
  const cookieStore = await cookies()
  const savedWorkspaceId = cookieStore.get('active_workspace_id')?.value

  // Query seluruh membership valid user
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, role, groups (*)')
    .eq('user_id', user.id)

  const validMemberships = memberships || []

  // Tentukan activeGroupId yang valid
  let activeGroupId = ''
  const isSavedValid = validMemberships.some((m) => m.group_id === savedWorkspaceId)

  if (isSavedValid && savedWorkspaceId) {
    activeGroupId = savedWorkspaceId
  } else {
    const personal = validMemberships.find((m) => m.groups?.type === 'personal')
    activeGroupId = personal?.group_id || validMemberships[0]?.group_id || ''
  }

  // 3. Query initial goals untuk active workspace tersebut (terproteksi RLS)
  let initialGoals: Goal[] = []
  if (activeGroupId) {
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('group_id', activeGroupId)
      .order('created_at', { ascending: false })

    initialGoals = (goalsData || []) as Goal[]
  }

  return (
    <div className="space-y-6">
      <GoalList
        initialGoals={initialGoals}
        initialWorkspaceId={activeGroupId}
      />
    </div>
  )
}
