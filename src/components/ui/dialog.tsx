'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Dialog({ isOpen, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-[#1C2538] bg-[#101522] p-6 text-slate-100 shadow-2xl transition-all',
          className
        )}
      >
        <button
          onClick={onClose}
          aria-label="Tutup modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-[#161C2C] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1.5 pr-6 pb-4', className)} {...props} />
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-bold text-white tracking-tight sm:text-xl', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-400', className)} {...props} />
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-4 border-t border-[#1C2538]',
        className
      )}
      {...props}
    />
  )
}
