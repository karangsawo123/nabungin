import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/logout-button'
import { Wallet, User as UserIcon, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verifikasi session server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil data profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Ambil data group / workspace tempat user terdaftar
  const { data: memberships } = await supabase
    .from('group_members')
    .select('role, groups (*)')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100">
      {/* Header / Navbar Sederhana */}
      <header className="border-b border-slate-800 bg-[#111827]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">
                Nabungin
              </span>
              <span className="ml-2 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                Auth V1 Aktif
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Konten Dashboard Sederhana */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Selamat Datang, {profile?.full_name || 'Pengguna'}! 👋
                </h1>
                <p className="mt-1 text-slate-400 text-sm">
                  Sesi autentikasi berhasil diverifikasi dan terhubung ke Supabase secara aman.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2 text-emerald-400 text-xs font-medium self-start sm:self-auto">
                <CheckCircle2 className="h-4 w-4" />
                <span>Session Active (SSR Guard)</span>
              </div>
            </div>
          </div>

          {/* Grid Status Profil & Workspace Otomatis */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Kartu Profil Database */}
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <UserIcon className="h-5 w-5 text-emerald-400" />
                <h2 className="font-semibold text-white">Data Profil (Database)</h2>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Nama Lengkap</dt>
                  <dd className="font-medium text-slate-200">
                    {profile?.full_name || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">User ID (auth.users)</dt>
                  <dd className="font-mono text-xs text-slate-400 break-all">
                    {user.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email Terdaftar</dt>
                  <dd className="text-slate-200">{user.email}</dd>
                </div>
              </dl>
            </div>

            {/* Kartu Workspace yang dibuat otomatis via Trigger */}
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="font-semibold text-white">
                  Workspace Aktif ({memberships?.length || 0})
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {memberships && memberships.length > 0 ? (
                  memberships.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {m.groups?.name || 'Workspace'}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          Tipe: {m.groups?.type}
                        </p>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20 uppercase">
                        {m.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Belum ada workspace terdaftar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
