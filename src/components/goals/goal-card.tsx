'use client'

import * as React from 'react'
import Link from 'next/link'
import { Target, Calendar, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { Goal } from '@/types/database'

export interface GoalCardProps {
  goal: Goal
}

export function GoalCard({ goal }: GoalCardProps) {
  const current = Number(goal.current_amount) || 0
  const target = Number(goal.target_amount) || 0

  // Perhitungan progress aman edge-case (bebas NaN, Infinity, negatif)
  const rawPercent = target > 0 ? (current / target) * 100 : 0
  const validPercent = isFinite(rawPercent) && !isNaN(rawPercent) ? Math.max(0, rawPercent) : 0
  const visualProgress = Math.min(100, Math.round(validPercent))
  const displayPercent = Math.round(validPercent * 10) / 10
  const remaining = Math.max(0, target - current)
  const isAchieved = target > 0 && current >= target

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-emerald-500/40 rounded-2xl"
    >
      <Card className="transition-all duration-200 hover:border-[#2A3650] hover:bg-[#121828] cursor-pointer">
        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Top Row: Icon, Title & Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  isAchieved
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white tracking-tight truncate group-hover:text-emerald-400 transition-colors">
                  {goal.name}
                </h3>
                {goal.description && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {goal.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isAchieved ? (
                <Badge variant="milestone" className="text-[11px] py-0.5">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Target Tercapai
                </Badge>
              ) : (
                <Badge variant="brand" className="text-[11px] py-0.5">
                  Aktif
                </Badge>
              )}
            </div>
          </div>

          {/* Middle Row: Financial Balances */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {formatRupiah(current)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                dari {formatRupiah(target)}
              </span>
            </div>
          </div>

          {/* Progress Bar Component */}
          <div className="space-y-1.5">
            <Progress
              value={visualProgress}
              variant={isAchieved ? 'amber' : 'emerald'}
              aria-label={`Progress tabungan ${goal.name}`}
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300">
                {displayPercent}% tercapai
              </span>
              <span>
                {isAchieved ? (
                  <span className="text-amber-400 font-medium">✓ Lunas</span>
                ) : (
                  <span>{formatRupiah(remaining)} lagi</span>
                )}
              </span>
            </div>
          </div>

          {/* Bottom Row: Metadata & Detail Arrow */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1C2538] text-xs text-slate-400">
            {goal.deadline ? (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="h-3 w-3 text-slate-500" />
                Target: {formatDate(goal.deadline)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Tanpa batas waktu</span>
            )}

            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium group-hover:translate-x-0.5 transition-transform">
              <span>Detail</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
