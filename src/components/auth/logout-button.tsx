'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LogoutButtonProps {
  className?: string
  showText?: boolean
  variant?: 'default' | 'topbar' | 'danger'
}

export function LogoutButton({
  className,
  showText = true,
  variant = 'default',
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Gagal logout:', error)
      setIsLoading(false)
    }
  }

  const baseStyles =
    variant === 'topbar'
      ? 'inline-flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm'
      : 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer'

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      title="Keluar dari akun"
      aria-label="Keluar dari akun"
      className={cn(baseStyles, className)}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-red-400" />
      ) : (
        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
      )}
      {showText && <span>Keluar</span>}
    </button>
  )
}
