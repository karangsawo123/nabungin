import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Target,
  Tags,
  BellRing,
  ShieldAlert,
  FileSpreadsheet,
  Lock,
  Database,
  Clock,
  Award,
} from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { InteractiveSimulator } from '@/components/landing/interactive-simulator'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#08111e] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pt-20 md:pb-16 text-center">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-96 w-[700px] rounded-full bg-emerald-500/10 blur-[120px]" />

          <div className="relative mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Gratis seumur hidup, tanpa biaya langganan</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.12]">
              Wujudkan Target Finansial,{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Sendiri Maupun Bersama
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base text-slate-400 sm:text-lg">
              Nabungin memisahkan pos tabungan Anda per target impian. Dana tidak lagi tercampur,
              progres terlihat jelas, dan saldo selalu sinkron otomatis dari database.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-emerald-600/35 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>Mulai Menabung Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-base font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                Coba Simulator Langsung
              </a>
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 pt-6 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Personal dan Shared Workspace</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Saldo dihitung otomatis oleh database</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Proteksi anti-minus built-in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Ekspor CSV kapan saja</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Simulator Section */}
        <InteractiveSimulator />

        {/* Features Section */}
        <section id="fitur" className="border-t border-slate-800/80 bg-[#0c1624] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Dibangun untuk transparansi nyata
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Semua yang dibutuhkan untuk menabung bersama
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-slate-800 bg-[#111d2e] p-6 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-5">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Multi-Workspace</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Satu akun untuk tabungan pribadi sekaligus beberapa grup kolaboratif. Pisahkan pos &quot;Dana Darurat&quot; dari &quot;Liburan Bali&quot; tanpa perlu ganti akun.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-slate-800 bg-[#111d2e] p-6 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-5">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Target Finansial dengan Deadline</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Buat goal dengan nama, nominal target, dan tanggal tenggat. Progress bar otomatis menghitung persentase berdasarkan saldo riil dari database, bukan input manual.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-slate-800 bg-[#111d2e] p-6 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 mb-5">
                  <Tags className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Pos Kategori Transaksi</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Setiap setoran dan penarikan diberi label pos: Alokasi Bulanan, Bonus dan THR, Sisa Belanja, atau kategori custom yang Anda buat sendiri per workspace.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-slate-800 bg-[#111d2e] p-6 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 mb-5">
                  <BellRing className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Notifikasi Realtime</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Saat anggota lain menyetor atau goal mencapai 100%, lonceng notifikasi di navbar menyala secara langsung tanpa me-refresh halaman berkat Supabase Realtime.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-slate-800 bg-[#111d2e] p-6 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-5">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Proteksi Anti-Minus</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Trigger PostgreSQL menjaga agar saldo tidak pernah negatif. Penarikan melebihi saldo tersedia langsung ditolak di level database, bukan hanya validasi UI.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-slate-800 bg-[#111d2e] p-6 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-5">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Ekspor Laporan CSV</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Unduh seluruh riwayat mutasi per workspace dalam format CSV atau Excel. Cocok untuk rekonsiliasi akhir bulan atau pembukuan bersama kelompok.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sebelum & Sesudah Section */}
        <section id="sebelum-sesudah" className="border-t border-slate-800/80 bg-[#08111e] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Perubahan nyata
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Dari cara lama yang rawan, ke catatan yang{' '}
                <span className="text-emerald-400">transparan dan akurat</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              {/* Kolom Sebelum */}
              <div className="border-b sm:border-b-0 sm:border-r border-rose-950/40 bg-rose-950/20 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Sebelum Nabungin
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Dana tabungan tercampur</strong> dengan uang belanja harian di satu rekening.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Tidak ada catatan siapa setor berapa</strong>. Konfirmasi lewat screenshot di grup chat yang cepat tenggelam.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Progress target tidak terlihat jelas</strong> karena saldo dihitung manual atau dikira-kira.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Penarikan berlebih tidak terdeteksi</strong> sampai saldo sudah habis dan target gagal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kolom Sesudah */}
              <div className="bg-emerald-950/20 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Dengan Nabungin
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Setiap tujuan punya pos sendiri</strong>. Dana Darurat, Liburan, DP Rumah, semuanya terpisah dan tidak bisa terpakai tidak sengaja.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Setiap setoran tercatat siapa, kapan, dan berapa</strong>. Anggota bisa lihat riwayat lengkap kapan saja.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Progress bar dihitung langsung dari database</strong>, bukan input manual, sehingga persentase selalu akurat.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white font-semibold">Trigger database menolak penarikan melebihi saldo</strong>. Saldo tidak bisa minus, target tetap aman.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Keamanan & Alur Transaksi Section */}
        <section id="alur" className="border-t border-slate-800/80 bg-[#0c1624] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Kolom Kiri: Integritas Data */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Integritas Data
                  </span>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
                    Saldo dihitung database, bukan klien
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Tidak seperti spreadsheet atau aplikasi catatan manual, Nabungin menghitung saldo langsung dari mutasi transaksi di PostgreSQL. Tidak ada celah manipulasi angka dari sisi klien.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                      <strong className="text-white font-semibold">Row Level Security</strong> di Supabase: data antar workspace terisolasi ketat dan tidak dapat diakses pihak lain.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                      <strong className="text-white font-semibold">Trigger otomatis</strong>: setiap mutasi langsung menyinkronkan saldo goal secara realtime tanpa input manual.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                      <strong className="text-white font-semibold">Invite token berbatas waktu</strong>: link undangan memiliki batas kadaluarsa dan kuota anggota demi keamanan grup.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                      <strong className="text-white font-semibold">Pencapaian permanen</strong>: setelah target lunas, status achieved tetap tersimpan sebagai rekam jejak keberhasilan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Alur Transaksi Card */}
              <div className="rounded-3xl border border-slate-800 bg-[#111d2e] p-6 sm:p-8 shadow-2xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
                  Alur Transaksi &amp; Validasi
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Isi form transaksi</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tentukan nominal, pos goal tabungan, dan kategori transaksi, lalu simpan.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-4 w-px bg-slate-800" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Validasi Server Action Next.js</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Data divalidasi dengan Zod schema di server untuk memastikan keaslian tipe dan otorisasi user.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-4 w-px bg-slate-800" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Kalkulasi Trigger PostgreSQL</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Database mengeksekusi perhitungan saldo atomik dari seluruh mutasi serta memastikan saldo tidak pernah minus.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-4 w-px bg-slate-800" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                      4
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Broadcast Realtime</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Pembaruan saldo dan milestone 100% dipancarkan langsung ke layar seluruh anggota lewat Supabase Realtime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="border-t border-slate-800/80 bg-gradient-to-b from-[#08111e] to-[#040810] px-4 py-20 sm:px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Mulai hari ini, gratis selamanya
            </h2>
            <p className="mx-auto max-w-xl text-base text-slate-400">
              Tidak perlu kartu kredit. Buat akun dan workspace pertama Anda langsung terbentuk otomatis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-emerald-600/35 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>Buat Akun Gratis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-7 py-3.5 text-base font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                Sudah punya akun
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060c15] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-300 text-sm">Nabungin</span>
          </div>
          <p>Platform pencatatan tabungan personal dan kolaboratif. Gratis selamanya.</p>
          <p>&copy; 2026 Nabungin. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
