import * as React from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  onClose?: () => void
  className?: string
}

export function Toast({
  type = 'info',
  title,
  message,
  onClose,
  className,
}: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0" />,
  }

  const borderBgs = {
    success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100',
    error: 'border-rose-500/30 bg-rose-950/40 text-rose-100',
    warning: 'border-amber-500/30 bg-amber-950/40 text-amber-100',
    info: 'border-sky-500/30 bg-sky-950/40 text-sky-100',
  }

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all',
        borderBgs[type],
        className
      )}
    >
      {icons[type]}
      <div className="flex-1 space-y-0.5 pr-2">
        <p className="text-sm font-semibold text-white">{title}</p>
        {message && <p className="text-xs text-slate-300">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Tutup pemberitahuan"
          className="rounded-md p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
