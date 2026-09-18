'use client'

import * as React from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, AlertCircle, Sparkles, LogIn, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { joinWorkspaceWithInviteAction } from '@/actions/collaboration'

export default function InviteAcceptPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = params?.token as string
  const workspaceId = searchParams?.get('workspace') || ''

  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [joinedGroupName, setJoinedGroupName] = React.useState('')
  const [isCheckingPwa, setIsCheckingPwa] = React.useState(true)

  // 1. Deteksi peluncuran PWA Standalone (aplikasi terinstall di HP)
  // Jika app dibuka dari icon layar utama HP karena shortcut lama tersimpan ke URL invite,
  // simpan data undangan ke localStorage dan langsung arahkan ke Landing Page agar app selalu bersih.
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean })?.standalone)

    const explicitView = sessionStorage.getItem(`viewing_invite_${token}`)

    if (isStandalone && explicitView !== 'true') {
      try {
        if (token && workspaceId) {
          localStorage.setItem(
            'nabungin_pending_invite',
            JSON.stringify({ token, workspaceId, timestamp: Date.now() })
          )
        }
      } catch {
        // Ignore storage error
      }
      // Alihkan langsung ke Landing Page bersih
      router.replace('/')
      return
    }

    setIsCheckingPwa(false)
  }, [token, workspaceId, router])

  const handleJoin = async () => {
    if (!token || !workspaceId) {
      setErrorMsg('Tautan undangan tidak lengkap. Pastikan URL menyertakan parameter token dan workspace.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await joinWorkspaceWithInviteAction({
        workspaceId,
        token,
      })

      if (!res.success) {
        setErrorMsg(res.error)
        setIsLoading(false)
        return
      }

      // Bersihkan pending invite jika sudah berhasil bergabung
      try {
        localStorage.removeItem('nabungin_pending_invite')
      } catch {}

      setIsSuccess(true)
      setJoinedGroupName(res.data.groupName)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch {
      setErrorMsg('Gagal memproses undangan. Pastikan Anda telah masuk ke akun Nabungin.')
      setIsLoading(false)
    }
  }

  const handleDiscardAndGoHome = () => {
    try {
      localStorage.removeItem('nabungin_pending_invite')
      sessionStorage.removeItem(`viewing_invite_${token}`)
    } catch {}
    router.push('/')
  }

  if (isCheckingPwa) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const loginRedirectUrl = `/login?redirectTo=/invite/${token}?workspace=${workspaceId}`
  const registerRedirectUrl = `/register?redirectTo=/invite/${token}?workspace=${workspaceId}`

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header dengan Logo Nabungin & Tombol Kembali */}
      <header className="mx-auto w-full max-w-4xl flex items-center justify-between py-2">
        <Logo variant="horizontal" size="sm" priority />

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#1C2538] bg-[#101522] px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Halaman Utama</span>
        </Link>
      </header>

      {/* Konten Utama: Card Undangan */}
      <main className="flex items-center justify-center py-6">
        <Card className="max-w-md w-full border-[#1C2538] bg-[#101522] shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto mb-3">
              <Users className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-white">
              Undangan Bergabung Ruang Tabungan
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs sm:text-sm mt-1">
              Anda diundang untuk menabung dan memantau target finansial bersama di platform Nabungin.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <span>{errorMsg}</span>
                  {errorMsg.toLowerCase().includes('masuk') && (
                    <div className="pt-1 flex gap-2">
                      <Link
                        href={loginRedirectUrl}
                        className="font-semibold underline hover:text-white"
                      >
                        Masuk sekarang
                      </Link>
                      <span>•</span>
                      <Link
                        href={registerRedirectUrl}
                        className="font-semibold underline hover:text-white"
                      >
                        Daftar akun baru
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Berhasil Bergabung! 🎉
                </h4>
                <p className="text-xs text-slate-300">
                  Anda kini telah menjadi anggota resmi dari ruang tabungan &quot;{joinedGroupName}&quot;. Mengalihkan ke dashboard...
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#1C2538] bg-[#090D16] p-4 text-xs text-slate-400 space-y-2">
                <span className="font-semibold text-white block">
                  Sebelum bergabung, pastikan:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Anda telah memiliki akun dan login ke Nabungin.</li>
                  <li>Tautan undangan belum kedaluwarsa atau kuotanya habis.</li>
                  <li>Anda mempercayai pembuat ruang tabungan ini.</li>
                </ul>
              </div>
            )}
          </CardContent>

          {!isSuccess && (
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleJoin}
                isLoading={isLoading}
                className="w-full min-h-[44px]"
              >
                <span>Terima Undangan & Gabung</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>

              {/* Opsi Auth Cepat bagi yang Belum Login / Belum Punya Akun */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 pt-0.5">
                <Link
                  href={loginRedirectUrl}
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                >
                  <LogIn className="h-3 w-3" />
                  <span>Masuk Akun</span>
                </Link>
                <span className="text-slate-600">•</span>
                <Link
                  href={registerRedirectUrl}
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Daftar Baru</span>
                </Link>
              </div>

              {/* Tombol Lewati / Buka Beranda */}
              <div className="w-full pt-2 border-t border-[#1C2538]">
                <button
                  type="button"
                  onClick={handleDiscardAndGoHome}
                  className="w-full text-center text-xs text-slate-400 hover:text-white py-2 transition-colors rounded-xl border border-[#1C2538] hover:border-slate-700 bg-[#090D16]/50"
                >
                  Lewati & Jelajahi Halaman Utama (Landing Page)
                </button>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>

      {/* Footer Hak Cipta & Link Bantuan */}
      <footer className="mx-auto w-full max-w-4xl text-center py-2 text-[11px] text-slate-500">
        Nabungin — Platform Tabungan Bersama & Personal Rp0
      </footer>
    </div>
  )
}
