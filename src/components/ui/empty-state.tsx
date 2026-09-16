import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1C2538] bg-[#101522]/40 p-8 text-center sm:p-12',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1C2538] bg-[#161C2C] text-slate-400 mb-4">
        <Icon className="h-6 w-6 text-emerald-400" />
      </div>
      <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
