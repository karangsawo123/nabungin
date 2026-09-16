import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import { ActiveWorkspaceSummary } from '@/components/groups/active-workspace-summary'
import { formatRupiah } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  const displayName = profile?.full_name || 'Penabung'

  return (
    <div className="space-y-6">
      {/* 1. Header Ringkas Sambutan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1C2538] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Nabungin Foundation
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date().toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Halo, {displayName}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola ruang tabungan personal dan kolaboratif Anda secara aman dan terisolasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="brand" className="py-1 px-3">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Workspace Active
          </Badge>
        </div>
      </div>

      {/* 2. Indikator & Ringkasan Workspace Aktif */}
      <ActiveWorkspaceSummary />

      {/* 2. Hero Total Tabungan Card (Fintech Inspiration) */}
      <div className="rounded-3xl border border-[#1C2538] bg-gradient-to-b from-[#141A2A] to-[#0E1320] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle Accent Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Akumulasi Saldo Tabungan
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
              {formatRupiah(0)}
            </div>
            <p className="text-xs text-slate-400">
              Saldo otomatis dihitung dari mutasi ledger (SUM deposit - withdrawal).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="deposit"
              size="md"
              className="flex-1 sm:flex-initial"
              onClick={undefined}
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>+ Setor (Deposit)</span>
            </Button>
            <Button
              variant="destructive"
              size="md"
              className="flex-1 sm:flex-initial"
              onClick={undefined}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>- Tarik (Withdraw)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Section Target Tabungan / Goals (Empty State Representation) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight sm:text-xl">
              Target Tabungan Aktif
            </h2>
          </div>
          <Button variant="outline" size="sm">
            <span>+ Buat Target</span>
          </Button>
        </div>

        {/* Empty State Component sesuai instruksi */}
        <EmptyState
          icon={Wallet}
          title="Belum Ada Target Tabungan"
          description="Kamu belum memiliki target tabungan aktif. Pada modul berikutnya, kamu dapat membuat target seperti Dana Darurat atau Liburan."
          action={
            <Button variant="primary" size="md">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Siapkan Target Pertama (Modul Goals)
            </Button>
          }
        />
      </div>

      {/* 4. Showcase Visual Primitives & Financial Semantic Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Spesifikasi Visual & Primitif Design System</CardTitle>
          <CardDescription>
            Standar token semantik finansial yang akan menjaga konsistensi visual di seluruh modul berikutnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Financial Semantic Badges */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">
              Semantik Warna Finansial (Accessible Contrast + Teks Simbolik)
            </span>
            <div className="flex flex-wrap gap-2.5">
              <Badge variant="deposit">+ Rp 500.000 (Deposit / Setor)</Badge>
              <Badge variant="withdrawal">- Rp 200.000 (Withdrawal / Tarik)</Badge>
              <Badge variant="milestone">🎉 Target 100% Tercapai (Milestone)</Badge>
              <Badge variant="personal">Personal Workspace</Badge>
              <Badge variant="shared">Shared Group</Badge>
              <Badge variant="outline">Role: Owner</Badge>
            </div>
          </div>

          {/* Progress Bar Component */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">
              Komponen Progress Bar (Accessible ARIA Progress)
            </span>
            <div className="space-y-3 max-w-xl">
              <Progress value={65} showLabel variant="emerald" />
              <Progress value={100} showLabel variant="amber" />
            </div>
          </div>

          {/* Button Variants */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">
              Varian Tombol Primitif (Keyboard Focused, Accessible Tap Targets)
            </span>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="primary" size="sm">
                Primary Button
              </Button>
              <Button variant="secondary" size="sm">
                Secondary Button
              </Button>
              <Button variant="outline" size="sm">
                Outline Button
              </Button>
              <Button variant="destructive" size="sm">
                Destructive Button
              </Button>
              <Button variant="ghost" size="sm">
                Ghost Button
              </Button>
              <Button variant="primary" size="sm" isLoading>
                Loading
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
