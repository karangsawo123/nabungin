import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-[#101522] px-3.5 py-2 text-base md:text-sm text-slate-100 placeholder-slate-500 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-[#1C2538] hover:border-[#2A3650]',
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              'text-xs',
              error ? 'text-rose-400' : 'text-slate-400'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
