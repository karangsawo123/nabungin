'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ArrowRight, X } from 'lucide-react'

interface PendingInviteData {
  token: string
  workspaceId: string
  timestamp?: number
}

export function PendingInviteBanner() {
  const router = useRouter()
  const [pendingInvite, setPendingInvite] = useState<PendingInviteData | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nabungin_pending_invite')
      if (stored) {
        const parsed = JSON.parse(stored) as PendingInviteData
        // Abaikan jika data tidak valid atau sudah lebih dari 7 hari
        if (parsed.token && parsed.workspaceId) {
          const age = Date.now() - (parsed.timestamp || 0)
          if (!parsed.timestamp || age < 7 * 24 * 60 * 60 * 1000) {
            setPendingInvite(parsed)
          } else {
            localStorage.removeItem('nabungin_pending_invite')
          }
        }
      }
    } catch {
      // Ignore parse error
    }
  }, [])

  if (!pendingInvite || isDismissed) return null

  const handleOpenInvite = () => {
    sessionStorage.setItem(`viewing_invite_${pendingInvite.token}`, 'true')
    router.push(`/invite/${pendingInvite.token}?workspace=${pendingInvite.workspaceId}`)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      localStorage.removeItem('nabungin_pending_invite')
    } catch {
      // Ignore
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2.5 shadow-md animate-in slide-in-from-top duration-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
            <Users className="h-3.5 w-3.5" />
          </div>
          <p className="truncate font-medium">
            Anda menerima tautan undangan bergabung ke <strong className="font-bold underline decoration-white/40">Ruang Tabungan Bersama</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenInvite}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-xs font-bold text-emerald-950 shadow-xs hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <span>Buka Undangan</span>
            <ArrowRight className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Abaikan undangan"
            title="Abaikan undangan"
            className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white transition-colors focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
