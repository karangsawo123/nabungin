'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] rounded-xl border border-[#1C2538] bg-[#101522] p-1.5 shadow-xl transition-all focus:outline-none',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-[#161C2C] hover:text-white focus:bg-[#161C2C] focus:outline-none disabled:opacity-50 disabled:pointer-events-none text-left cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-[#1C2538]" />
}
