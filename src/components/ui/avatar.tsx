import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base font-semibold',
  }

  // Ambil inisial nama (maks 2 huruf)
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#2A3650] bg-[#161C2C] text-slate-200 font-medium select-none',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
