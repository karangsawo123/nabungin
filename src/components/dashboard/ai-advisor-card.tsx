'use client'

import * as React from 'react'
import {
  Bot,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
  Clock,
  Calendar,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/components/groups/workspace-context'
import { getGoalsByWorkspace } from '@/actions/goals'
import { calculateClosestGoal, type ClosestGoalInfo } from '@/lib/ai/advisor-helpers'
import { formatRupiah } from '@/lib/utils'
import type { Goal } from '@/types/database'

export function AiAdvisorCard() {
  const { activeGroupId } = useWorkspace()
  const [closestGoal, setClosestGoal] = React.useState<ClosestGoalInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!activeGroupId) return
    let isCancelled = false
    setIsLoading(true)

    getGoalsByWorkspace(activeGroupId)
      .then((goals: Goal[]) => {
        if (!isCancelled) {
          const closest = calculateClosestGoal(goals)
          setClosestGoal(closest)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [activeGroupId])

  const handleOpenAdvisorWithQuery = (query: string) => {
    const event = new CustomEvent('nabungin:ask-advisor', {
      detail: { query },
    })
    window.dispatchEvent(event)
  }

  const handleOpenGeneral = () => {
    const event = new CustomEvent('nabungin:ask-advisor', {
      detail: { query: '' },
    })
    window.dispatchEvent(event)
  }

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-[#121929] via-[#0E1422] to-[#0A0F1A] shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <CardContent className="p-6 relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Bot className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Konsultan Tabungan Pribadi (Nabu AI)
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-2.5 w-2.5" /> Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Konsultasikan alokasi dana, simulasi deadline target, dan strategi menabung realistis
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenGeneral}
            className="gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40 cursor-pointer self-start sm:self-auto"
          >
            <span>Buka Konsultasi</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Highlight Target Deadline Terdekat */}
        {closestGoal && (
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#151D2F] to-emerald-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                  <Clock className="h-3 w-3" /> Target Deadline Terdekat
                </span>
                <span className="text-xs font-bold text-white">{closestGoal.name}</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-2">
                <span>
                  Sisa: <strong className="text-white">{formatRupiah(closestGoal.remainingAmount)}</strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {closestGoal.deadline ? `Batas: ${closestGoal.deadline} (Sisa ${closestGoal.remainingDays} hari)` : 'Horizon waktu 90 hari'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Rekomendasi Setoran:</div>
                <div className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono">
                  {formatRupiah(closestGoal.dailyRequired)} <span className="text-[10px] font-normal text-slate-400">/ hari</span>
                  <span className="mx-1 text-slate-600">|</span>
                  {formatRupiah(closestGoal.weeklyRequired)} <span className="text-[10px] font-normal text-slate-400">/ mgg</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleOpenAdvisorWithQuery(
                    `Bagaimana strategi menabung harian & mingguan untuk menyelesaikan target "${closestGoal.name}" tepat waktu?`
                  )
                }
                className="rounded-xl border border-emerald-500/40 bg-emerald-600/20 p-2 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                title="Tanyakan strategi target ini ke Nabu"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* 1-Click Consultation Prompts */}
        <div className="border-t border-slate-800/80 pt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Topik Diskusi Cepat (1-Klik):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                handleOpenAdvisorWithQuery(
                  closestGoal
                    ? `Berapa setoran harian dan mingguan ideal untuk menyelesaikan target "${closestGoal.name}" sebelum deadline?`
                    : 'Target mana yang perlu diprioritaskan dan berapa estimasi setoran idealnya?'
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#151C2C]/80 p-2.5 text-left text-xs text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition-all cursor-pointer group"
            >
              <Target className="h-4 w-4 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="line-clamp-2">Rekomendasi Setoran Target Terdekat</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleOpenAdvisorWithQuery('Analisis performa tabunganku dan evaluasi kebiasaan mutasi 30 hari terakhir')
              }
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#151C2C]/80 p-2.5 text-left text-xs text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition-all cursor-pointer group"
            >
              <TrendingUp className="h-4 w-4 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="line-clamp-2">Evaluasi Performa & Kebiasaan Mutasi</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleOpenAdvisorWithQuery('Bagaimana cara membagi porsi gaji bulanan dengan metode 50/30/20 agar tidak boncos?')
              }
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#151C2C]/80 p-2.5 text-left text-xs text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition-all cursor-pointer group"
            >
              <Zap className="h-4 w-4 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="line-clamp-2">Alokasi Gaji 50/30/20 & Anti-Boncos</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
