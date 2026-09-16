import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, requiredIndicator, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-xs font-medium uppercase tracking-wider text-slate-400 select-none',
          className
        )}
        {...props}
      >
        {children}
        {requiredIndicator && (
          <span className="ml-1 text-rose-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )
  }
)

Label.displayName = 'Label'
