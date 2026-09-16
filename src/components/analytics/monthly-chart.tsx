'use client'

import * as React from 'react'
import { TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import type { MonthlyMetric } from '@/actions/analytics'

interface MonthlyChartProps {
  metrics: MonthlyMetric[]
  className?: string
}

export function MonthlyChart({ metrics, className = '' }: MonthlyChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  // Cari nilai maksimum untuk normalisasi tinggi bar
  const maxVal = Math.max(
    ...metrics.map((m) => Math.max(m.deposit, m.withdrawal)),
    1000000 // minimum scale 1 juta agar bar kosong tetap proporsional
  )

  const hasData = metrics.some((m) => m.deposit > 0 || m.withdrawal > 0)

  return (
    <div className={`rounded-2xl border border-[#1C2538] bg-[#0E1320] p-5 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Tren Bulanan
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">6 Bulan Terakhir</span>
          </div>
          <h3 className="text-base font-bold text-white">Setoran vs Penarikan</h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-300 font-medium">Setoran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            <span className="text-slate-300 font-medium">Penarikan</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1C2538] rounded-xl bg-[#090D16]/50">
          <TrendingUp className="h-8 w-8 text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-300">Belum Ada Transaksi</p>
          <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
            Grafik mutasi setoran dan penarikan akan terbentuk otomatis setelah ada riwayat tabungan.
          </p>
        </div>
      ) : (
        <div>
          {/* Bar Chart Canvas */}
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-2 border-b border-[#1C2538]">
            {metrics.map((m, idx) => {
              const depositHeight = Math.max(4, Math.round((m.deposit / maxVal) * 100))
              const withdrawalHeight = Math.max(4, Math.round((m.withdrawal / maxVal) * 100))
              const isHovered = hoveredIndex === idx

              return (
                <div
                  key={m.monthKey}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-30 pointer-events-none rounded-lg border border-[#2A3650] bg-[#090D16] px-2.5 py-1.5 shadow-xl text-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[10px] font-semibold text-slate-300 mb-0.5">
                        {m.monthLabel}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="text-emerald-400">+{formatRupiah(m.deposit)}</span>
                        {m.withdrawal > 0 && (
                          <span className="text-rose-400">-{formatRupiah(m.withdrawal)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dual Bars Container */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                    {/* Deposit Bar */}
                    <div
                      style={{ height: `${depositHeight}%` }}
                      className={`w-full max-w-[18px] sm:max-w-[24px] rounded-t transition-all duration-300 ${
                        m.deposit > 0
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-500/20'
                          : 'bg-emerald-950/20'
                      } ${isHovered ? 'brightness-125 scale-y-[1.02]' : ''}`}
                    />

                    {/* Withdrawal Bar */}
                    <div
                      style={{ height: `${withdrawalHeight}%` }}
                      className={`w-full max-w-[18px] sm:max-w-[24px] rounded-t transition-all duration-300 ${
                        m.withdrawal > 0
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm shadow-rose-500/20'
                          : 'bg-rose-950/20'
                      } ${isHovered ? 'brightness-125 scale-y-[1.02]' : ''}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between gap-2 sm:gap-4 mt-2.5 px-1">
            {metrics.map((m, idx) => (
              <div
                key={m.monthKey}
                className={`flex-1 text-center text-[11px] font-medium transition-colors ${
                  hoveredIndex === idx ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                {m.monthLabel}
              </div>
            ))}
          </div>

          {/* Quick Summary Pill below chart */}
          <div className="mt-4 pt-4 border-t border-[#1C2538]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Total Setoran 6 Bulan:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {formatRupiah(metrics.reduce((acc, m) => acc + m.deposit, 0))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-slate-400">Total Penarikan 6 Bulan:</span>
              <span className="font-mono font-semibold text-rose-400">
                {formatRupiah(metrics.reduce((acc, m) => acc + m.withdrawal, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
