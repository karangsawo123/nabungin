'use client'

import * as React from 'react'
import { PieChart, Users, Layers } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { formatRupiah } from '@/lib/utils'
import type { MemberContribution, CategoryAllocation } from '@/actions/analytics'

interface ContributionBreakdownProps {
  isPersonal: boolean
  contributions: MemberContribution[]
  categoryAllocations: CategoryAllocation[]
  className?: string
}

export function ContributionBreakdown({
  isPersonal,
  contributions,
  categoryAllocations,
  className = '',
}: ContributionBreakdownProps) {
  // Jika Personal workspace, tampilkan pos kategori; jika Shared, tampilkan kontribusi anggota
  const showMemberBreakdown = !isPersonal && contributions.length > 0
  const hasData = showMemberBreakdown
    ? contributions.length > 0
    : categoryAllocations.length > 0

  return (
    <div className={`rounded-2xl border border-[#1C2538] bg-[#0E1320] p-5 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              {showMemberBreakdown ? (
                <Users className="h-3.5 w-3.5" />
              ) : (
                <Layers className="h-3.5 w-3.5" />
              )}
              {showMemberBreakdown ? 'Kolaborasi Bersama' : 'Distribusi Tabungan'}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-400">All-Time</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {showMemberBreakdown ? 'Kontribusi Anggota' : 'Alokasi Berdasarkan Pos Kategori'}
          </h3>
        </div>
      </div>

      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1C2538] rounded-xl bg-[#090D16]/50">
          <PieChart className="h-7 w-7 text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-300">Belum Ada Setoran</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Lakukan setoran ke target tabungan untuk melihat porsi distribusi finansial.
          </p>
        </div>
      ) : showMemberBreakdown ? (
        /* Member Contribution List */
        <div className="space-y-3.5">
          {contributions.map((c) => (
            <div key={c.userId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={c.name} src={c.avatarUrl} size="xs" />
                  <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                    {c.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-emerald-400 font-semibold">
                    {formatRupiah(c.totalDeposit)}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px] w-8 text-right">
                    {c.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-[#161C2C] overflow-hidden">
                <div
                  style={{ width: `${Math.max(4, c.percentage)}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Category Allocation List */
        <div className="space-y-3.5">
          {categoryAllocations.map((cat) => (
            <div key={cat.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-slate-200 font-semibold">
                    {formatRupiah(cat.totalAmount)}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px] w-8 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-[#161C2C] overflow-hidden">
                <div
                  style={{
                    width: `${Math.max(4, cat.percentage)}%`,
                    backgroundColor: cat.color,
                  }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
