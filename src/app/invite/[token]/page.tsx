'use client'

import * as React from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, AlertCircle, Sparkles, LogIn, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4">
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
              <span>{errorMsg}</span>
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
          <CardFooter className="flex flex-col gap-2.5 pt-2">
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

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
              <span>Belum login?</span>
              <Link
                href={`/login?redirectTo=/invite/${token}?workspace=${workspaceId}`}
                className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
              >
                <LogIn className="h-3 w-3" />
                <span>Masuk Sekarang</span>
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
