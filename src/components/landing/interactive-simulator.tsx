'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react'

interface ActivityItem {
  id: string
  actor: string
  type: 'deposit' | 'withdraw'
  amount: number
  time: string
}

interface Step {
  actor: string | null
  type: 'deposit' | 'withdraw' | 'reset'
  btnId: string
  amount: number
}

const AUTO_STEPS: Step[] = [
  { actor: 'Dewi', type: 'deposit', btnId: 'btn-d500', amount: 500000 },
  { actor: 'Rian', type: 'deposit', btnId: 'btn-d1000', amount: 1000000 },
  { actor: 'Sarah', type: 'deposit', btnId: 'btn-d500', amount: 500000 },
  { actor: 'Anda', type: 'withdraw', btnId: 'btn-w500', amount: 500000 },
  { actor: 'Budi', type: 'deposit', btnId: 'btn-d1000', amount: 1000000 },
  { actor: 'Sarah', type: 'deposit', btnId: 'btn-d500', amount: 500000 },
  { actor: 'Rian', type: 'deposit', btnId: 'btn-d1000', amount: 1000000 },
  { actor: null, type: 'reset', btnId: 'btn-reset', amount: 0 },
]

function formatRp(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID')
}

export function InteractiveSimulator() {
  const targetAmount = 5000000
  const [balance, setBalance] = useState<number>(4000000)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [nextStepLabel, setNextStepLabel] = useState<string>('Memuat simulasi otomatis...')
  const [activeNextBtn, setActiveNextBtn] = useState<string | null>(null)
  const [pressedBtn, setPressedBtn] = useState<string | null>(null)
  const [noteMessage, setNoteMessage] = useState<string>(
    'Klik tombol kapan saja untuk mencoba langsung. Demo akan melanjutkan otomatis.'
  )
  const [isNoteError, setIsNoteError] = useState<boolean>(false)

  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: '1', actor: 'Rian', type: 'deposit', amount: 1000000, time: '14 Sep' },
    { id: '2', actor: 'Sarah', type: 'deposit', amount: 1500000, time: '12 Sep' },
    { id: '3', actor: 'Budi', type: 'deposit', amount: 1500000, time: '10 Sep' },
  ])

  const stepIndexRef = useRef<number>(0)
  const balanceRef = useRef<number>(4000000)
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isPausedRef = useRef<boolean>(false)

  // Keep ref synchronized with state
  useEffect(() => {
    balanceRef.current = balance
  }, [balance])

  const triggerPressFlash = (btnId: string) => {
    setPressedBtn(btnId)
    setTimeout(() => {
      setPressedBtn((prev) => (prev === btnId ? null : prev))
    }, 250)
  }

  const addActivity = useCallback((type: 'deposit' | 'withdraw', amount: number, actorName?: string) => {
    const newItem: ActivityItem = {
      id: `${Date.now()}-${Math.random()}`,
      actor: actorName || 'Anda',
      type,
      amount,
      time: 'baru saja',
    }
    setActivities((prev) => [newItem, ...prev.slice(0, 5)])
  }, [])

  const executeStep = useCallback((step: Step) => {
    triggerPressFlash(step.btnId)
    setActiveNextBtn(null)

    if (step.type === 'deposit') {
      const nextBal = balanceRef.current + step.amount
      balanceRef.current = nextBal
      setBalance(nextBal)
      addActivity('deposit', step.amount, step.actor || 'Anggota')
    } else if (step.type === 'withdraw') {
      if (balanceRef.current - step.amount >= 0) {
        const nextBal = balanceRef.current - step.amount
        balanceRef.current = nextBal
        setBalance(nextBal)
        addActivity('withdraw', step.amount, step.actor || 'Anda')
      }
    } else if (step.type === 'reset') {
      balanceRef.current = 4000000
      setBalance(4000000)
    }

    stepIndexRef.current = (stepIndexRef.current + 1) % AUTO_STEPS.length
  }, [addActivity])

  const scheduleNext = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)

    if (isPausedRef.current) return

    const step = AUTO_STEPS[stepIndexRef.current]

    // Update narrative label
    if (step.type === 'reset') {
      setNextStepLabel('Demo akan diulang dari awal...')
    } else if (step.type === 'deposit') {
      setNextStepLabel(`${step.actor} akan menyetor ${formatRp(step.amount)}`)
    } else {
      setNextStepLabel(`${step.actor} akan menarik ${formatRp(step.amount)}`)
    }

    // Highlight button after a slight beat
    highlightTimerRef.current = setTimeout(() => {
      if (!isPausedRef.current) {
        setActiveNextBtn(step.btnId)
      }
    }, 300)

    // Execute after 2.5s
    autoTimerRef.current = setTimeout(() => {
      if (!isPausedRef.current) {
        executeStep(step)
        scheduleNext()
      }
    }, 2500)
  }, [executeStep])

  const pauseAutoplay = useCallback((duration = 8000) => {
    isPausedRef.current = true
    setIsPaused(true)
    setActiveNextBtn(null)
    setNextStepLabel('Demo dijeda. Melanjutkan otomatis dalam beberapa detik...')

    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)

    pauseTimerRef.current = setTimeout(() => {
      isPausedRef.current = false
      setIsPaused(false)
      scheduleNext()
    }, duration)
  }, [scheduleNext])

  // Handle manual user interactions
  const handleManualDeposit = (amount: number) => {
    triggerPressFlash(amount === 500000 ? 'btn-d500' : 'btn-d1000')
    const nextBal = balanceRef.current + amount
    balanceRef.current = nextBal
    setBalance(nextBal)
    addActivity('deposit', amount, 'Anda')
    pauseAutoplay(8000)
  }

  const handleManualWithdraw = (amount: number) => {
    triggerPressFlash('btn-w500')
    if (balanceRef.current - amount < 0) {
      setIsNoteError(true)
      setNoteMessage('Proteksi anti-minus aktif: saldo tidak boleh negatif. Penarikan ditolak.')
      setTimeout(() => {
        setIsNoteError(false)
        setNoteMessage('Klik tombol kapan saja untuk mencoba langsung. Demo akan melanjutkan otomatis.')
      }, 3500)
      pauseAutoplay(8000)
      return
    }

    const nextBal = balanceRef.current - amount
    balanceRef.current = nextBal
    setBalance(nextBal)
    addActivity('withdraw', amount, 'Anda')
    pauseAutoplay(8000)
  }

  const handleManualReset = () => {
    triggerPressFlash('btn-reset')
    balanceRef.current = 4000000
    stepIndexRef.current = 0
    setBalance(4000000)
    pauseAutoplay(5000)
  }

  useEffect(() => {
    const initTimer = setTimeout(() => {
      scheduleNext()
    }, 1500)

    return () => {
      clearTimeout(initTimer)
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [scheduleNext])

  const pct = Math.min(100, Math.round((balance / targetAmount) * 100))
  const isCompleted = balance >= targetAmount
  const remaining = Math.max(0, targetAmount - balance)

  return (
    <section id="demo" className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1624]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Glow ambient background effect */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

        {/* Milestone Banner */}
        {isCompleted && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent p-4 text-left animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm sm:text-base">
                Target Tercapai! 100% Terkumpul
              </h4>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-300">
                Notifikasi otomatis terkirim ke seluruh anggota grup. Dana siap dicairkan kapan saja.
              </p>
            </div>
          </div>
        )}

        {/* Card Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              <span>Shared Workspace · 4 Anggota</span>
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              🏖️ Liburan Akhir Tahun di Bali
            </h3>
            <p className="mt-1 text-xs text-slate-400">Tenggat Target: 31 Desember 2026</p>
          </div>

          <div>
            {isCompleted ? (
              <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 shadow-sm">
                Lunas (100%)
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                Status: Aktif
              </span>
            )}
          </div>
        </div>

        {/* Balance Display */}
        <div className="pt-6">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Saldo Terkumpul Saat Ini
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {formatRp(balance)}
            </span>
            <span className="text-sm font-medium text-slate-400">
              dari target {formatRp(targetAmount)}
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="mt-4 h-3.5 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900/90 p-0.5"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres tabungan"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isCompleted
                  ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Progress Labels */}
          <div className="mt-2 flex items-center justify-between text-xs font-medium">
            <span className={isCompleted ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {pct}% tercapai
            </span>
            <span className="text-slate-400">
              {isCompleted ? 'Target terpenuhi' : `${formatRp(remaining)} lagi`}
            </span>
          </div>
        </div>

        {/* Autoplay Status Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Simulasi Langsung:
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {nextStepLabel}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              isPaused
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>{isPaused ? 'Dijeda' : 'Berjalan otomatis'}</span>
          </div>
        </div>

        {/* Interactive Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button
            id="btn-d500"
            type="button"
            onClick={() => handleManualDeposit(500000)}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
              activeNextBtn === 'btn-d500' ? 'sim-btn-auto-next' : ''
            } ${pressedBtn === 'btn-d500' ? 'sim-btn-press' : ''}`}
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span>+ Setor 500rb</span>
          </button>

          <button
            id="btn-d1000"
            type="button"
            onClick={() => handleManualDeposit(1000000)}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
              activeNextBtn === 'btn-d1000' ? 'sim-btn-auto-next' : ''
            } ${pressedBtn === 'btn-d1000' ? 'sim-btn-press' : ''}`}
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span>+ Setor 1 Juta</span>
          </button>

          <button
            id="btn-w500"
            type="button"
            onClick={() => handleManualWithdraw(500000)}
            className={`sim-btn-withdraw flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-rose-400 ${
              activeNextBtn === 'btn-w500' ? 'sim-btn-auto-next' : ''
            } ${pressedBtn === 'btn-w500' ? 'sim-btn-press' : ''}`}
          >
            <ArrowDownCircle className="h-4 w-4" />
            <span>− Tarik 500rb</span>
          </button>

          <button
            id="btn-reset"
            type="button"
            onClick={handleManualReset}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-slate-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-slate-400 ${
              activeNextBtn === 'btn-reset' ? 'sim-btn-auto-next' : ''
            } ${pressedBtn === 'btn-reset' ? 'sim-btn-press' : ''}`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Ulang Demo</span>
          </button>
        </div>

        {/* Note / Error alert */}
        <p
          className={`mt-2.5 text-center text-xs transition-colors duration-200 ${
            isNoteError ? 'font-semibold text-rose-400' : 'text-slate-400'
          }`}
        >
          {noteMessage}
        </p>

        {/* Activity Feed */}
        <div className="mt-6 border-t border-slate-800/80 pt-5 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Riwayat Aktivitas Mutasi Realtime
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg bg-slate-900/50 px-3 py-2 text-xs transition-all animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <span
                  className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    item.type === 'deposit' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span className="text-slate-300">
                  <strong className="font-semibold text-white">{item.actor}</strong>{' '}
                  {item.type === 'deposit' ? 'menyetor' : 'menarik'}{' '}
                  <span
                    className={`font-semibold ${
                      item.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatRp(item.amount)}
                  </span>
                </span>
                <span className="ml-auto flex-shrink-0 text-[11px] text-slate-500">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
