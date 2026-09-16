'use client'

import * as React from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  UserPlus,
  UserMinus,
  Sparkles,
  Layers,
  History,
  Clock,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import {
  getActivityLogsByWorkspaceAction,
  type ActivityLogWithProfile,
} from '@/actions/activity'
import { formatRupiah, formatDate } from '@/lib/utils'

interface ActivityTimelineProps {
  workspaceId: string
  className?: string
  limit?: number
}

export function ActivityTimeline({
  workspaceId,
  className = '',
  limit = 20,
}: ActivityTimelineProps) {
  const [activities, setActivities] = React.useState<ActivityLogWithProfile[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadActivities = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getActivityLogsByWorkspaceAction(workspaceId, limit)
      setActivities(data)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, limit])

  React.useEffect(() => {
    loadActivities()

    // Setup Supabase Realtime subscription untuk activity_logs di workspace ini
    const supabase = createClient()
    const channel = supabase
      .channel(`workspace-activity-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `group_id=eq.${workspaceId}`,
        },
        async () => {
          // Re-fetch untuk menyertakan profile join yang valid
          const updated = await getActivityLogsByWorkspaceAction(workspaceId, limit)
          setActivities(updated)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, limit, loadActivities])

  const renderActionIcon = (action: string) => {
    switch (action) {
      case 'deposit_created':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="h-3.5 w-3.5" />
          </div>
        )
      case 'withdrawal_created':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        )
      case 'goal_created':
      case 'goal_updated':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Target className="h-3.5 w-3.5" />
          </div>
        )
      case 'member_joined':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <UserPlus className="h-3.5 w-3.5" />
          </div>
        )
      case 'member_removed':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <UserMinus className="h-3.5 w-3.5" />
          </div>
        )
      case 'category_created':
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Layers className="h-3.5 w-3.5" />
          </div>
        )
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
            <History className="h-3.5 w-3.5" />
          </div>
        )
    }
  }

  const renderActionText = (log: ActivityLogWithProfile) => {
    const actor = log.profiles?.full_name || 'Anggota'
    const meta = (log.metadata || {}) as Record<string, unknown>

    switch (log.action) {
      case 'deposit_created':
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> menyetor{' '}
            <span className="font-mono font-semibold text-emerald-400">
              {formatRupiah(Number(meta.amount) || 0)}
            </span>{' '}
            ke <span className="text-slate-200">{String(meta.goal_name || 'target')}</span>
          </p>
        )
      case 'withdrawal_created':
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> menarik{' '}
            <span className="font-mono font-semibold text-rose-400">
              {formatRupiah(Number(meta.amount) || 0)}
            </span>{' '}
            dari <span className="text-slate-200">{String(meta.goal_name || 'target')}</span>
          </p>
        )
      case 'goal_created':
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> membuat target baru{' '}
            <span className="text-slate-100 font-semibold">{String(meta.name || 'Target')}</span>
          </p>
        )
      case 'goal_updated':
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> memperbarui target{' '}
            <span className="text-slate-100 font-semibold">{String(meta.name || 'Target')}</span>
          </p>
        )
      case 'member_joined':
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> bergabung ke ruang tabungan
          </p>
        )
      case 'member_removed':
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> keluar atau dikeluarkan dari ruang tabungan
          </p>
        )
      case 'category_created':
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> menambahkan pos kategori{' '}
            <span className="text-slate-100 font-semibold">{String(meta.name || 'Kategori')}</span>
          </p>
        )
      default:
        return (
          <p className="text-xs text-slate-300">
            <span className="font-semibold text-white">{actor}</span> melakukan aktivitas pada sistem
          </p>
        )
    }
  }

  if (loading && activities.length === 0) {
    return (
      <div className={`space-y-3 p-4 rounded-xl border border-[#1C2538] bg-[#0E1320] ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Clock className="h-4 w-4 animate-spin text-emerald-400" />
          Memuat lini masa aktivitas...
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className={`p-6 text-center rounded-xl border border-[#1C2538] bg-[#0E1320] ${className}`}>
        <Sparkles className="h-6 w-6 text-slate-600 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-300">Belum Ada Aktivitas</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Setiap transaksi dan kolaborasi baru akan tercatat di sini secara otomatis.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-[#1C2538] bg-[#0E1320] overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C2538] bg-[#0B0F19]">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Lini Masa Aktivitas
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Realtime
        </span>
      </div>

      <div className="divide-y divide-[#1C2538] max-h-96 overflow-y-auto">
        {activities.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3.5 hover:bg-[#131929]/50 transition-colors"
          >
            <div className="shrink-0 mt-0.5">{renderActionIcon(log.action)}</div>

            <div className="flex-1 min-w-0 space-y-1">
              {renderActionText(log)}

              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="font-medium">{formatDate(log.created_at)}</span>
                {log.profiles && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400 truncate max-w-[120px]">
                      <Avatar
                        name={log.profiles.full_name}
                        src={log.profiles.avatar_url}
                        size="xs"
                      />
                      {log.profiles.full_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
