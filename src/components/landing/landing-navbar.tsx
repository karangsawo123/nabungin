'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/brand/logo'

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '#demo', label: 'Coba Demo' },
    { href: '#fitur', label: 'Fitur' },
    { href: '#sebelum-sesudah', label: 'Sebelum & Sesudah' },
    { href: '#alur', label: 'Cara Kerja' },
  ]

  const closeMenu = () => setIsOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#EBE6DE] bg-[#FAF8F5]/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand with Option 2 Logo */}
        <Logo variant="horizontal" size="md" priority />

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navigasi Desktop">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-md px-1 py-0.5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700 hover:bg-emerald-50/60 focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/30 focus-visible:outline-2 focus-visible:outline-emerald-600 active:scale-98"
          >
            <span>Daftar Gratis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700"
          >
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCD5C9] bg-white text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-500"
            aria-expanded={isOpen}
            aria-label="Buka menu navigasi"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-[#EBE6DE] bg-[#FAF8F5]/98 px-4 pb-6 pt-3 shadow-lg backdrop-blur-xl animate-in fade-in duration-150">
          <nav className="flex flex-col gap-2" aria-label="Navigasi Mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 border-t border-[#EBE6DE] pt-3 flex flex-col gap-2">
              <Link
                href="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <span>Daftar Akun Gratis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
