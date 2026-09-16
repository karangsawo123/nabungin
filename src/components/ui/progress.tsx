import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'emerald' | 'amber' | 'sky' | 'rose'
  showLabel?: boolean
}

export function Progress({
  value,
  max = 100,
  variant = 'emerald',
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100)

  const variantFills = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    rose: 'bg-rose-500',
  }

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-slate-400">
          <span>Progres</span>
          <span className="font-semibold text-slate-200">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-[#161C2C] border border-[#1C2538]"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantFills[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
