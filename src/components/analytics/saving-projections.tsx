'use client'

import * as React from 'react'
import {
  Compass,
  Calendar,
  Sparkles,
  Trophy,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import type { GoalProjection } from '@/actions/analytics'

interface SavingProjectionsProps {
  projections: GoalProjection[]
  className?: string
}

export function SavingProjections({ projections, className = '' }: SavingProjectionsProps) {
  // Cek apakah ada goal yang sudah tercapai untuk Celebration Banner (ketat: uang harus >= target)
  const achievedGoals = projections.filter(
    (p) => p.isAchieved && p.targetAmount > 0 && p.currentAmount >= p.targetAmount
  )
  const activeProjections = projections.filter(
    (p) => !p.isAchieved || p.targetAmount <= 0 || p.currentAmount < p.targetAmount
  )

  if (projections.length === 0) {
    return null
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. Target Celebration Banner (jika ada goal yang tercapai) */}
      {achievedGoals.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Milestone Tercapai!
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  Selamat! {achievedGoals.length} Target Telah Berhasil Terkumpul Penuh 🎉
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {achievedGoals.map((g) => g.goalName).join(', ')} telah mencapai 100% dari target
                  dana yang direncanakan. Disiplin finansial Anda terbukti membuahkan hasil nyata!
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                100% Achieved
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Proyeksi Tabungan & Kebutuhan Bulanan */}
      {activeProjections.length > 0 && (
        <div className="rounded-2xl border border-[#1C2538] bg-[#0E1320] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5" />
                  Simulasi & Perkiraan
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span className="text-xs text-slate-400">Estimasi Finansial</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Proyeksi Pencapaian Target Tabungan
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs sm:text-right">
              Perkiraan berdasarkan kebiasaan menabung aktual. Tampil sebagai estimasi, bukan
              jaminan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjections.map((p) => (
              <div
                key={p.goalId}
                className="rounded-xl border border-[#1C2538] bg-[#101522] p-4 flex flex-col justify-between space-y-4 hover:border-[#2A3650] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h5 className="text-sm font-bold text-white truncate">{p.goalName}</h5>
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {p.percentProgress}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-[#1C2538]">
                    <span>Terkumpul:</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatRupiah(p.currentAmount)} / {formatRupiah(p.targetAmount)}
                    </span>
                  </div>

                  <div className="pt-3 space-y-2.5 text-xs">
                    {/* Kebutuhan Bulanan (Monthly Requirement) */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        Kebutuhan / Bulan:
                      </span>
                      {p.monthlyRequirement ? (
                        <span className="font-mono font-bold text-white">
                          {formatRupiah(p.monthlyRequirement)}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">/bln</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">
                          Belum ditentukan tenggat
                        </span>
                      )}
                    </div>

                    {/* Estimasi Selesai (Estimated Completion Date) */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        Estimasi Tercapai:
                      </span>
                      {p.hasSufficientData && p.estimatedCompletionDate ? (
                        <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {p.estimatedCompletionDate}
                        </span>
                      ) : (
                        <span className="text-amber-400/80 text-[11px] font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          Belum cukup data untuk proyeksi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Note jika data belum cukup */}
                {!p.hasSufficientData && (
                  <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-300/80">
                    Lakukan minimal 2 kali transaksi setoran untuk mengaktifkan kalkulasi kecepatan
                    menabung.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
