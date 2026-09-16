import * as React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Gagal Memuat Data',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-slate-200',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400 shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-white text-sm sm:text-base">
            {title}
          </h3>
          <p className="text-sm text-slate-300">{message}</p>
          {onRetry && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Coba Lagi
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
