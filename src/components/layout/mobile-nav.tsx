'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  ArrowLeftRight,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Beranda',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      label: 'Tabungan',
      href: '/goals',
      icon: Target,
      active: pathname.startsWith('/goals'),
    },
    {
      label: 'Transaksi',
      href: '#transactions',
      icon: ArrowLeftRight,
      active: pathname.startsWith('/transactions'),
    },
    {
      label: 'Akun',
      href: '#profile',
      icon: User,
      active: pathname.startsWith('/profile'),
    },
  ]

  return (
    <nav
      aria-label="Navigasi Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#1C2538] bg-[#0E131F]/95 backdrop-blur-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors select-none',
                item.active
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                  item.active ? 'bg-emerald-500/15' : 'transparent'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
