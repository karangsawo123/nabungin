import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
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
import { Logo } from '@/components/brand/logo'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-slate-800 selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pb-12 pt-14 sm:px-6 sm:pt-20 md:pb-16 text-center">
          {/* Ambient Warm & Growth Glows */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-96 w-[700px] rounded-full bg-emerald-500/10 blur-[130px]" />
          <div className="pointer-events-none absolute right-1/4 top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-[100px]" />

          <div className="relative mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-50/90 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Gratis seumur hidup, tanpa biaya langganan</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.12]">
              Wujudkan Target Finansial,{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                Sendiri Maupun Bersama
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg font-medium leading-relaxed">
              Nabungin memisahkan pos tabungan Anda per target impian. Dana tidak lagi tercampur,
              progres terlihat jelas, dan saldo selalu sinkron otomatis dari database.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 focus-visible:outline-2 focus-visible:outline-emerald-600 active:scale-98"
              >
                <span>Mulai Menabung Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-[#DCD5C9] bg-white px-7 py-3.5 text-base font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-500 active:scale-98"
              >
                Coba Simulator Langsung
              </a>
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 pt-6 text-xs text-slate-600 font-semibold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Personal &amp; Shared Workspace</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Saldo dihitung otomatis database</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Proteksi anti-minus built-in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Ekspor CSV kapan saja</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Simulator Section */}
        <InteractiveSimulator />

        {/* Features Section */}
        <section id="fitur" className="border-t border-[#EBE6DE] bg-[#F4EFE6]/60 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Dibangun untuk transparansi nyata
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Semua yang dibutuhkan untuk menabung bersama
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-[#EBE6DE] bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#DCD5C9]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 mb-5 shadow-2xs">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Multi-Workspace</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Satu akun untuk tabungan pribadi sekaligus beberapa grup kolaboratif. Pisahkan pos &quot;Dana Darurat&quot; dari &quot;Liburan Bali&quot; tanpa perlu ganti akun.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-[#EBE6DE] bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#DCD5C9]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-50 text-amber-600 mb-5 shadow-2xs">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Target Finansial dengan Deadline</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Buat goal dengan nama, nominal target, dan tanggal tenggat. Progress bar otomatis menghitung persentase berdasarkan saldo riil dari database, bukan input manual.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-[#EBE6DE] bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#DCD5C9]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 mb-5 shadow-2xs">
                  <Tags className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Pos Kategori Transaksi</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Setiap setoran dan penarikan diberi label pos: Alokasi Bulanan, Bonus dan THR, Sisa Belanja, atau kategori custom yang Anda buat sendiri per workspace.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-[#EBE6DE] bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#DCD5C9]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-50 text-amber-600 mb-5 shadow-2xs">
                  <BellRing className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Notifikasi Realtime</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Saat anggota lain menyetor atau goal mencapai 100%, lonceng notifikasi di navbar menyala secara langsung tanpa me-refresh halaman berkat Supabase Realtime.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-[#EBE6DE] bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#DCD5C9]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 mb-5 shadow-2xs">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Proteksi Anti-Minus</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Trigger PostgreSQL menjaga agar saldo tidak pernah negatif. Penarikan melebihi saldo tersedia langsung ditolak di level database, bukan hanya validasi UI.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-[#EBE6DE] bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#DCD5C9]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-50 text-amber-600 mb-5 shadow-2xs">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Ekspor Laporan CSV</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Unduh seluruh riwayat mutasi per workspace dalam format CSV atau Excel. Cocok untuk rekonsiliasi akhir bulan atau pembukuan bersama kelompok.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sebelum & Sesudah Section */}
        <section id="sebelum-sesudah" className="border-t border-[#EBE6DE] bg-[#FAF8F5] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Perubahan nyata
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Dari cara lama yang rawan, ke catatan yang{' '}
                <span className="text-emerald-600">transparan dan akurat</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 rounded-3xl border border-[#EBE6DE] bg-white overflow-hidden shadow-lg shadow-amber-900/5">
              {/* Kolom Sebelum */}
              <div className="border-b sm:border-b-0 sm:border-r border-[#EBE6DE] bg-rose-50/40 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    Sebelum Nabungin
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Dana tabungan tercampur</strong> dengan uang belanja harian di satu rekening.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Tidak ada catatan siapa setor berapa</strong>. Konfirmasi lewat screenshot di grup chat yang cepat tenggelam.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Progress target tidak terlihat jelas</strong> karena saldo dihitung manual atau dikira-kira.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Penarikan berlebih tidak terdeteksi</strong> sampai saldo sudah habis dan target gagal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kolom Sesudah */}
              <div className="bg-emerald-50/40 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Dengan Nabungin
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Setiap tujuan punya pos sendiri</strong>. Dana Darurat, Liburan, DP Rumah, semuanya terpisah dan tidak bisa terpakai tidak sengaja.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Setiap setoran tercatat siapa, kapan, dan berapa</strong>. Anggota bisa lihat riwayat lengkap kapan saja.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Progress bar dihitung langsung dari database</strong>, bukan input manual, sehingga persentase selalu akurat.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Trigger database menolak penarikan melebihi saldo</strong>. Saldo tidak bisa minus, target tetap aman.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Keamanan & Alur Transaksi Section */}
        <section id="alur" className="border-t border-[#EBE6DE] bg-[#F4EFE6]/60 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Kolom Kiri: Integritas Data */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                    Integritas Data
                  </span>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    Saldo dihitung database, bukan klien
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                  Tidak seperti spreadsheet atau aplikasi catatan manual, Nabungin menghitung saldo langsung dari mutasi transaksi di PostgreSQL. Tidak ada celah manipulasi angka dari sisi klien.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 font-medium">
                      <strong className="text-slate-900 font-bold">Row Level Security</strong> di Supabase: data antar workspace terisolasi ketat dan tidak dapat diakses pihak lain.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 font-medium">
                      <strong className="text-slate-900 font-bold">Trigger otomatis</strong>: setiap mutasi langsung menyinkronkan saldo goal secara realtime tanpa input manual.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 font-medium">
                      <strong className="text-slate-900 font-bold">Invite token berbatas waktu</strong>: link undangan memiliki batas kadaluarsa dan kuota anggota demi keamanan grup.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 font-medium">
                      <strong className="text-slate-900 font-bold">Pencapaian permanen</strong>: setelah target lunas, status achieved tetap tersimpan sebagai rekam jejak keberhasilan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Alur Transaksi Card */}
              <div className="rounded-3xl border border-[#EBE6DE] bg-white p-6 sm:p-8 shadow-lg shadow-amber-900/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
                  Alur Transaksi &amp; Validasi
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-50 text-xs font-bold text-emerald-700 shadow-2xs">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Isi form transaksi</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Tentukan nominal, pos goal tabungan, dan kategori transaksi, lalu simpan.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-4 w-px bg-[#EBE6DE]" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-50 text-xs font-bold text-emerald-700 shadow-2xs">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Validasi Server Action Next.js</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Data divalidasi dengan Zod schema di server untuk memastikan keaslian tipe dan otorisasi user.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-4 w-px bg-[#EBE6DE]" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-50 text-xs font-bold text-emerald-700 shadow-2xs">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Kalkulasi Trigger PostgreSQL</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Database mengeksekusi perhitungan saldo atomik dari seluruh mutasi serta memastikan saldo tidak pernah minus.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-4 w-px bg-[#EBE6DE]" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-50 text-xs font-bold text-amber-700 shadow-2xs">
                      4
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Broadcast Realtime</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
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
        <section className="border-t border-[#EBE6DE] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-4 py-20 sm:px-6 text-center text-white relative overflow-hidden">
          <div className="pointer-events-none absolute left-10 top-0 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="pointer-events-none absolute right-10 bottom-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative mx-auto max-w-3xl space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              Mulai hari ini, gratis selamanya
            </h2>
            <p className="mx-auto max-w-xl text-base text-emerald-100 font-medium">
              Tidak perlu kartu kredit. Buat akun dan workspace pertama Anda langsung terbentuk otomatis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 text-base font-bold text-amber-950 shadow-lg shadow-amber-950/20 transition-all hover:bg-amber-300 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-white active:scale-98"
              >
                <span>Buat Akun Gratis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-800/50 px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-emerald-800/80 focus-visible:outline-2 focus-visible:outline-white active:scale-98"
              >
                Sudah punya akun
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Option 2 Brand Logo & Tagline */}
      <footer className="border-t border-[#EBE6DE] bg-[#FAF8F5] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo variant="horizontal" size="sm" />
          </div>
          <p className="font-medium text-slate-600">
            Nabung bersama, tumbuh bersama. Gratis selamanya.
          </p>
          <p className="text-slate-500">&copy; 2026 Nabungin. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
