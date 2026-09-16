import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'brand'
    | 'deposit'
    | 'withdrawal'
    | 'milestone'
    | 'outline'
    | 'personal'
    | 'shared'
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      'bg-[#161C2C] text-slate-300 border border-[#1C2538]',
    brand:
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    deposit:
      'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium',
    withdrawal:
      'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium',
    milestone:
      'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold',
    outline:
      'border border-slate-700 text-slate-300 bg-transparent',
    personal:
      'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    shared:
      'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs tracking-wide transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
