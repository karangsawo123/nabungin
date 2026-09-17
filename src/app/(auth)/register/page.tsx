'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Loader2, ArrowRight, CheckCircle2, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react'
import { formatAuthIdentifier, validateUsername } from '@/lib/auth-helpers'
import { Logo } from '@/components/brand/logo'

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedName = fullName.trim()
    const trimmedUsername = username.trim().toLowerCase()

    if (!trimmedUsername) {
      setErrorMsg('Username wajib diisi.')
      return
    }

    const usernameValidation = validateUsername(trimmedUsername)
    if (!usernameValidation.valid) {
      setErrorMsg(usernameValidation.message || 'Format username tidak valid.')
      return
    }

    if (!password) {
      setErrorMsg('Kata sandi wajib diisi.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Mohon periksa kembali.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const internalEmail = formatAuthIdentifier(trimmedUsername)
      const displayName = trimmedName || trimmedUsername

      // Mengirimkan full_name dan username via user metadata
      // Trigger PostgreSQL otomatis membuat profile & default personal workspace!
      const { data, error } = await supabase.auth.signUp({
        email: internalEmail,
        password,
        options: {
          data: {
            full_name: displayName,
            username: trimmedUsername,
          },
        },
      })

      if (error) {
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already in use')
        ) {
          setErrorMsg(
            `Username "${trimmedUsername}" sudah dipakai orang lain. Silakan pilih username yang berbeda.`
          )
        } else if (error.message.toLowerCase().includes('password')) {
          setErrorMsg('Kata sandi terlalu lemah atau kurang dari 6 karakter.')
        } else {
          setErrorMsg(error.message)
        }
        setIsLoading(false)
        return
      }

      // Jika konfirmasi email di Supabase masih aktif
      if (data.user && !data.session) {
        setIsSuccess(true)
        setIsLoading(false)
        return
      }

      // Jika auto-confirmed (langsung ada session), arahkan ke dashboard
      router.push('/dashboard')
      router.refresh()
    } catch {
      setErrorMsg('Terjadi gangguan jaringan. Silakan coba beberapa saat lagi.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      {/* Navigation to Landing Page Header */}
      <div className="w-full max-w-md mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-800 bg-[#111827]/90 px-4 py-2 text-xs font-bold text-slate-300 shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/40 hover:bg-slate-800 hover:text-white"
          title="Kembali ke Landing Page Nabungin"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:-translate-x-1" />
          <span>Lihat Landing Page</span>
        </Link>

        <Logo variant="horizontal" size="sm" withLink />
      </div>

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-[#111827] p-8 shadow-2xl shadow-emerald-950/20">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Buat Akun Nabungin
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Mulai menabung tanpa perlu memasukkan email pribadi
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-slate-200">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <h3 className="font-semibold text-emerald-300">Pendaftaran Berhasil!</h3>
            <p className="text-sm text-slate-300">
              Akun dengan username <span className="font-mono text-emerald-300">@{username}</span> telah berhasil didaftarkan.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                Masuk Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-slate-300"
                >
                  Nama Panggilan / Lengkap
                </label>
                <div className="mt-1">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Dimas Aditya"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Tanpa simbol @</span>
                </div>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="contoh: dimas123"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimal 3 karakter (huruf, angka, titik, atau garis bawah).
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300"
                >
                  Kata Sandi <span className="text-rose-400">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (minimal 6 karakter)"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-300"
                >
                  Ulangi Kata Sandi <span className="text-rose-400">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Privasi terjaga: Tidak memerlukan email asli Anda.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer pt-2.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="space-y-3 pt-2 text-center text-sm text-slate-400">
              <div>
                Sudah punya akun?{' '}
                <Link
                  href="/login"
                  className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                >
                  Masuk di sini
                </Link>
              </div>

              {/* Secondary Landing Page Link */}
              <div className="border-t border-slate-800/80 pt-4">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Mau coba simulator target finansial?</span>
                  <span className="text-emerald-400 group-hover:underline">Buka Landing Page →</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
