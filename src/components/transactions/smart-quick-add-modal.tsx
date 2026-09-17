'use client'

import * as React from 'react'
import {
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatRupiah } from '@/lib/utils'
import { parseQuickAddTransactionAction } from '@/actions/ai-quick-add'
import { createTransactionAction } from '@/actions/transactions'
import { getGoalsByWorkspace } from '@/actions/goals'
import { getCategoriesByWorkspace } from '@/actions/categories'
import { useWorkspace } from '@/components/groups/workspace-context'
import type { Goal, Category, Transaction, TransactionType } from '@/types/database'
import type { ParsedTransactionResult } from '@/lib/ai/fallback-parser'

export interface SmartQuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (transaction: Transaction) => void
  onOpenFullForm?: (prefilled: {
    type: TransactionType
    goalId: string
    categoryId: string
    amount: number
    notes: string
  }) => void
}

export function SmartQuickAddModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenFullForm,
}: SmartQuickAddModalProps) {
  const { activeGroupId, triggerRefresh } = useWorkspace()

  const [prompt, setPrompt] = React.useState('')
  const [isParsing, setIsParsing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  const [goals, setGoals] = React.useState<Goal[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [parsedData, setParsedData] = React.useState<ParsedTransactionResult | null>(null)

  // API Key management
  const [customApiKey, setCustomApiKey] = React.useState('')
  const [hasServerKey, setHasServerKey] = React.useState(false)
  const [showKeyInput, setShowKeyInput] = React.useState(false)

  // Load user goals & categories, and stored API key
  React.useEffect(() => {
    if (isOpen && activeGroupId) {
      setParseError(null)
      setSaveError(null)
      setSaveSuccess(false)

      const savedKey = localStorage.getItem('nabungin_custom_gemini_key') || ''
      setCustomApiKey(savedKey)

      Promise.all([
        getGoalsByWorkspace(activeGroupId),
        getCategoriesByWorkspace(activeGroupId),
      ]).then(([goalsData, catsData]) => {
        setGoals(goalsData)
        setCategories(catsData)
      })
    }
  }, [isOpen, activeGroupId])

  // Handle parse request
  const handleParse = async (textToParse?: string) => {
    const text = (textToParse || prompt).trim()
    if (!text) {
      setParseError('Tuliskan kalimat transaksi terlebih dahulu.')
      return
    }

    setIsParsing(true)
    setParseError(null)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const res = await parseQuickAddTransactionAction({
        prompt: text,
        workspaceId: activeGroupId,
        customApiKey: customApiKey.trim() || undefined,
      })

      setHasServerKey(res.hasApiKeyConfigured)

      if (!res.success || !res.data) {
        setParseError(res.error || 'Gagal memproses kalimat transaksi.')
        setIsParsing(false)
        return
      }

      setParsedData(res.data)
    } catch {
      setParseError('Terjadi gangguan jaringan saat memproses AI.')
    } finally {
      setIsParsing(false)
    }
  }

  // Handle Direct Save
  const handleDirectSave = async () => {
    if (!parsedData || !activeGroupId) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await createTransactionAction({
        workspaceId: activeGroupId,
        goalId: parsedData.goalId,
        categoryId: parsedData.categoryId,
        type: parsedData.type,
        amount: parsedData.amount,
        notes: parsedData.notes,
      })

      if (!res.success) {
        setSaveError(res.error)
        setIsSaving(false)
        return
      }

      setSaveSuccess(true)
      triggerRefresh()
      if (onSuccess) onSuccess(res.transaction)

      // Auto close after brief success indicator
      setTimeout(() => {
        handleClose()
      }, 1200)
    } catch {
      setSaveError('Terjadi kesalahan saat menyimpan transaksi.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving || isParsing) return
    setPrompt('')
    setParsedData(null)
    setParseError(null)
    setSaveError(null)
    setSaveSuccess(false)
    onClose()
  }

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key)
    if (key.trim()) {
      localStorage.setItem('nabungin_custom_gemini_key', key.trim())
    } else {
      localStorage.removeItem('nabungin_custom_gemini_key')
    }
  }

  // Example pills
  const samplePills = React.useMemo(() => {
    const firstGoal = goals[0]?.name || 'Liburan'
    const secondGoal = goals[1]?.name || 'Dana Darurat'
    return [
      `Setor 150rb ke ${firstGoal} buat jajan`,
      `Tarik 50k dari ${secondGoal} buat beli obat`,
      `Nabung 500.000 sisa gaji kemarin`,
      `Setor 1.5jt untuk cicilan laptop`,
    ]
  }, [goals])

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="max-w-xl">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Zap className="h-5 w-5 fill-emerald-400 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
                <span>Smart Quick-Add AI</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-2.5 w-2.5" /> AI Powered
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Ketik kalimat santai, AI otomatis mendeteksi nominal, target & kategori
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#161C2C] px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            title="Pengaturan API Key"
          >
            <Key className="h-3 w-3 text-amber-400" />
            <span>API Key</span>
            {showKeyInput ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-3">
        {/* Accordion Pengaturan API Key */}
        {showKeyInput && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between font-semibold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" /> Konfigurasi AI Engine (Groq / Gemini)
              </span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:underline"
              >
                Groq Console <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <p className="text-slate-400">
              API Key tersimpan aman di server <code className="text-emerald-300">.env.local</code> (<code className="text-emerald-300">GROQ_API_KEY</code> / <code className="text-emerald-300">GEMINI_API_KEY</code>). Kamu juga bisa memasukkan kunci cadangan di bawah:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="gsk_... (Groq) atau AIzaSy... (Gemini)"
                value={customApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              {customApiKey && (
                <button
                  type="button"
                  onClick={() => handleSaveApiKey('')}
                  className="rounded-lg border border-slate-800 px-2 text-[11px] text-slate-400 hover:text-white"
                >
                  Hapus
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Status Engine Server:{' '}
              <span className="font-bold text-emerald-400">🟢 Groq AI (Llama 3.3 / GPT-OSS Ultra-Fast) Terhubung</span>
            </div>
          </div>
        )}

        {/* Input Prompt Bahasa Alami */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Tuliskan Transaksi:
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleParse()
                }
              }}
              placeholder="Contoh: Setor 150rb ke Tabungan Liburan untuk pos Makan Jalan-jalan..."
              className="w-full resize-none rounded-xl border border-slate-800 bg-[#0B0F19] p-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <div className="absolute right-2.5 bottom-3">
              <Button
                type="button"
                size="sm"
                onClick={() => handleParse()}
                disabled={isParsing || !prompt.trim()}
                className="h-8 gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Analisis AI</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Saran Contoh Kalimat */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-slate-400">Coba contoh cepat:</span>
          <div className="flex flex-wrap gap-1.5">
            {samplePills.map((pill, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPrompt(pill)
                  handleParse(pill)
                }}
                className="rounded-full border border-slate-800 bg-[#161C2C]/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition-all cursor-pointer text-left"
              >
                ✨ {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {parseError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Hasil Ekstraksi AI */}
        {parsedData && (
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-b from-[#161C2C] to-[#0E131F] p-4 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    parsedData.type === 'deposit'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {parsedData.type === 'deposit' ? '+ Setoran' : '- Penarikan'}
                </span>
                <span className="text-sm font-extrabold text-white">
                  {formatRupiah(parsedData.amount)}
                </span>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                {parsedData.provider === 'groq' ? (
                  <>
                    <Zap className="h-2.5 w-2.5 text-amber-400 fill-amber-400" /> Groq AI (Llama 3.3)
                  </>
                ) : parsedData.provider === 'gemini' ? (
                  <>
                    <Sparkles className="h-2.5 w-2.5 text-amber-400" /> Gemini AI
                  </>
                ) : (
                  <>
                    <Zap className="h-2.5 w-2.5 text-emerald-400" /> Smart Local NLP
                  </>
                )}
              </span>
            </div>

            {/* Form Fields Ringkas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">
                  Target Tabungan:
                </label>
                <select
                  value={parsedData.goalId}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, goalId: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Terkumpul: {formatRupiah(g.current_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">
                  Kategori Pos:
                </label>
                <select
                  value={parsedData.categoryId}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, categoryId: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400">
                  Catatan Transaksi:
                </label>
                <input
                  type="text"
                  value={parsedData.notes}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, notes: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Penjelasan AI */}
            {parsedData.explanation && (
              <div className="rounded-lg bg-[#0B0F19]/60 p-2.5 text-[11px] text-slate-400 border border-slate-800/80">
                <span className="font-semibold text-emerald-400">Insight AI:</span>{' '}
                {parsedData.explanation}
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Transaksi berhasil dicatat dan saldo telah diperbarui!</span>
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-800 pt-3">
        {parsedData && onOpenFullForm ? (
          <button
            type="button"
            onClick={() => {
              onOpenFullForm({
                type: parsedData.type,
                goalId: parsedData.goalId,
                categoryId: parsedData.categoryId,
                amount: parsedData.amount,
                notes: parsedData.notes,
              })
              handleClose()
            }}
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors text-left"
          >
            Buka di Form Lengkap →
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
          >
            Batal
          </Button>

          {parsedData && (
            <Button
              type="button"
              size="sm"
              onClick={handleDirectSave}
              disabled={isSaving || saveSuccess}
              className="gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  <span>Simpan Transaksi Sekarang</span>
                </>
              )}
            </Button>
          )}
        </div>
      </DialogFooter>
    </Dialog>
  )
}
