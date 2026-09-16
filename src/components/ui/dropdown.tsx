'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

interface DropdownContextType {
  close: () => void
}

const DropdownContext = React.createContext<DropdownContextType>({
  close: () => {},
})

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={dropdownRef} className="relative inline-block text-left">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen((prev) => !prev)
            }
          }}
          className="cursor-pointer"
        >
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
    </DropdownContext.Provider>
  )
}

export function DropdownItem({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { close } = React.useContext(DropdownContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    onClick?.(e)
    close()
  }

  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
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
