import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'deposit'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090D16] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer'

    const variants = {
      primary:
        'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-sm',
      secondary:
        'bg-[#161C2C] text-slate-200 hover:bg-[#1C2438] active:bg-[#202940] border border-[#1C2538]',
      outline:
        'border border-[#1C2538] text-slate-300 hover:bg-[#161C2C] hover:text-white active:bg-[#1C2438]',
      ghost:
        'text-slate-400 hover:bg-[#161C2C] hover:text-slate-200 active:bg-[#1C2438]',
      destructive:
        'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:bg-rose-500/30',
      deposit:
        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:bg-emerald-500/30',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
      icon: 'h-10 w-10 min-h-[44px] min-w-[44px] p-2 rounded-xl',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            <span className="sr-only">Memproses...</span>
          </>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
