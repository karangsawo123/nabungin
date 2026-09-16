'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Sparkles, Trophy, Users, Info, ExternalLink } from 'lucide-react'
import { Dropdown } from '@/components/ui/dropdown'
import { createClient } from '@/lib/supabase/client'
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/actions/notifications'
import { formatDate } from '@/lib/utils'
import type { Notification } from '@/types/database'

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await getNotificationsAction()
      setNotifications(data)
      const unread = data.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    } catch {
      // silent catch
    }
  }, [])

  // Inisialisasi data dan Realtime subscription
  React.useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchNotifications()

        // Realtime Subscription untuk notifikasi baru milik user
        const channel = supabase
          .channel(`user-notifications-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification
              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((c) => c + 1)
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    })
  }, [fetchNotifications])

  const handleMarkAsRead = async (notif: Notification) => {
    if (!notif.is_read) {
      await markNotificationAsReadAction(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }

    if (notif.link) {
      router.push(notif.link)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'goal_reached':
        return <Trophy className="h-4 w-4 text-amber-400" />
      case 'member_joined':
        return <Users className="h-4 w-4 text-emerald-400" />
      default:
        return <Info className="h-4 w-4 text-blue-400" />
    }
  }

  return (
    <Dropdown
      align="right"
      className="w-80 sm:w-96 p-0 overflow-hidden"
      trigger={
        <button
          type="button"
          aria-label="Pemberitahuan"
          className="relative flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1C2538] bg-[#101522] text-slate-400 transition-colors hover:border-[#2A3650] hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-[#090D16]" />
            </span>
          )}
        </button>
      }
    >
      {/* Dropdown Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#1C2538] bg-[#0E1320]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Notifikasi
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold font-mono">
              {unreadCount} baru
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="h-3 w-3" />
            <span>Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Notification Items */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#1C2538]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <Sparkles className="h-6 w-6 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">Semuanya Sudah Rapi</p>
            <p className="text-[11px] text-slate-500">
              Belum ada notifikasi baru saat ini.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif)}
              className={`p-3.5 transition-colors cursor-pointer text-left flex items-start gap-3 hover:bg-[#161C2C] ${
                !notif.is_read ? 'bg-emerald-500/5' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0 rounded-lg p-1.5 bg-[#141A2A] border border-[#1C2538]">
                {getNotifIcon(notif.type)}
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5
                    className={`text-xs font-semibold truncate ${
                      !notif.is_read ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {notif.title}
                  </h5>
                  {!notif.is_read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>{formatDate(notif.created_at)}</span>
                  {notif.link && (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      Lihat <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Dropdown>
  )
}
