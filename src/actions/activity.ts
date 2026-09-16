'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActivityLog } from '@/types/database'

export interface ActivityLogWithProfile extends ActivityLog {
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

export async function getActivityLogsByWorkspaceAction(
  workspaceId: string,
  limit = 20
): Promise<ActivityLogWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select(
      `
      *,
      profiles (id, full_name, avatar_url)
    `
    )
    .eq('group_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as unknown as ActivityLogWithProfile[]
}
