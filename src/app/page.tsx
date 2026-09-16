import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Wallet, ArrowRight, Shield, Users, Target } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F19] text-slate-100">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-[#111827]/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Nabungin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
            <span>✨ Platform Tabungan Cerdas Personal & Kolaboratif</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Wujudkan Target Finansial,{' '}
            <span className="text-emerald-400">Sendiri Maupun Bersama</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-slate-400 sm:text-lg">
            Kelola tabungan pribadi dan patungan bersama pasangan atau teman dengan
            transparansi mutlak, kalkulasi saldo otomatis, dan berbiaya operasional Rp0.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
            >
              <span>Mulai Menabung Sekarang</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-base font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
            >
              Masuk ke Akun
            </Link>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
            <div className="rounded-xl border border-slate-800 bg-[#111827]/60 p-5">
              <Shield className="h-5 w-5 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-white text-sm">Aman & Terpercaya</h3>
              <p className="text-xs text-slate-400 mt-1">Row Level Security di setiap level data tabungan.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#111827]/60 p-5">
              <Users className="h-5 w-5 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-white text-sm">Multi-Workspace</h3>
              <p className="text-xs text-slate-400 mt-1">Satu akun untuk tabungan pribadi & grup tanpa batas.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#111827]/60 p-5">
              <Target className="h-5 w-5 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-white text-sm">Target & Milestone</h3>
              <p className="text-xs text-slate-400 mt-1">Visualisasi progress dan notifikasi saat target tercapai.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
