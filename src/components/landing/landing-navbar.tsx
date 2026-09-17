'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Wallet, Menu, X, ArrowRight } from 'lucide-react'

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
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#08111e]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-emerald-400"
          aria-label="Nabungin Beranda"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Nabungin
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navigasi Desktop">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-emerald-600/35 focus-visible:outline-2 focus-visible:outline-white"
          >
            <span>Daftar Gratis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
            aria-expanded={isOpen}
            aria-label="Buka menu navigasi"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#08111e]/95 px-4 pb-6 pt-3 backdrop-blur-xl animate-in fade-in duration-150">
          <nav className="flex flex-col gap-3" aria-label="Navigasi Mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 border-t border-slate-800/80 pt-3 flex flex-col gap-2">
              <Link
                href="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500"
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
