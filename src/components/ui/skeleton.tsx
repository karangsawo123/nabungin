import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle'
}

export function Skeleton({
  className,
  variant = 'rect',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[#161C2C] border border-[#1C2538]/60',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 rounded-md',
        variant === 'rect' && 'rounded-xl',
        className
      )}
      {...props}
    />
  )
}
