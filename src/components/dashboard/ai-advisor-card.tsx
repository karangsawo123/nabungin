'use client'

import * as React from 'react'
import {
  Bot,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/components/groups/workspace-context'

export function AiAdvisorCard() {
  const { activeGroup } = useWorkspace()

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
                Konsultasikan alokasi dana, simulasi pelunasan target, dan evaluasi kebiasaan menabung
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

        {/* 1-Click Consultation Prompts */}
        <div className="border-t border-slate-800/80 pt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Topik Konsultasi Cepat (1-Klik):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                handleOpenAdvisorWithQuery('Target mana yang perlu diprioritaskan dan berapa setoran idealnya?')
              }
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#151C2C]/80 p-2.5 text-left text-xs text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition-all cursor-pointer group"
            >
              <Target className="h-4 w-4 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="line-clamp-2">Prioritas & Estimasi Setoran Target</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleOpenAdvisorWithQuery('Buatkan strategi realistis agar saya bisa mencapai target lebih cepat')
              }
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#151C2C]/80 p-2.5 text-left text-xs text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition-all cursor-pointer group"
            >
              <Zap className="h-4 w-4 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="line-clamp-2">Strategi Capai Target Lebih Cepat</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
