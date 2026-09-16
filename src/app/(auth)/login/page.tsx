'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogIn, Loader2, ArrowRight, User } from 'lucide-react'
import { formatAuthIdentifier } from '@/lib/auth-helpers'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanInput = username.trim()
    if (!cleanInput || !password) {
      setErrorMsg('Harap isi username dan kata sandi.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const emailIdentifier = formatAuthIdentifier(cleanInput)

      const { error } = await supabase.auth.signInWithPassword({
        email: emailIdentifier,
        password,
      })

      if (error) {
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          setErrorMsg('Username atau kata sandi yang kamu masukkan salah.')
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg(
            'Akun belum aktif. Mohon pastikan opsi "Confirm email" di pengaturan Supabase telah dinonaktifkan.'
          )
        } else {
          setErrorMsg(error.message)
        }
        setIsLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-[#111827] p-8 shadow-2xl shadow-emerald-950/20">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Masuk ke Nabungin
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Kelola tabungan personal & grup kolaboratifmu dengan mudah
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-300"
            >
              Username
            </label>
            <div className="relative mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username (tanpa @)"
                className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Cukup gunakan username akunmu, tidak perlu memasukkan email.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Kata Sandi
              </label>
            </div>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Daftar dengan username di sini
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
