'use client'

import * as React from 'react'
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  X,
  Trash2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import {
  askFinancialAdvisorAction,
  type AdvisorChatMessage,
  type AdvisorResponse,
} from '@/actions/ai-advisor'
import { useWorkspace } from '@/components/groups/workspace-context'

export function AiAdvisorDrawer() {
  const { activeGroupId, activeGroup } = useWorkspace()

  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<AdvisorChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Halo! Saya **Nabu**, konsultan tabungan pribadimu di Nabungin. 🌿\n\nSaya telah terhubung secara aman dengan ruang tabunganmu. Kamu bisa menanyakan strategi alokasi tabungan, evaluasi kebiasaan menabung, atau simulasi target impianmu!',
    },
  ])
  const [inputMessage, setInputMessage] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [advisorMeta, setAdvisorMeta] = React.useState<AdvisorResponse | null>(null)
  const [suggestedQuestions, setSuggestedQuestions] = React.useState<string[]>([
    '📊 Analisis performa tabungan saya saat ini',
    '🎯 Target mana yang paling mendesak untuk diselesaikan?',
    '💡 Bagaimana strategi menabung realistis tiap bulan?',
  ])

  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when messages update
  React.useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  // Listen for custom trigger to open advisor with a preset query
  React.useEffect(() => {
    const handleOpenWithQuery = (e: CustomEvent<{ query: string }>) => {
      setIsOpen(true)
      if (e.detail?.query) {
        handleSendMessage(e.detail.query)
      }
    }
    window.addEventListener('nabungin:ask-advisor' as any, handleOpenWithQuery)
    return () => {
      window.removeEventListener('nabungin:ask-advisor' as any, handleOpenWithQuery)
    }
  }, [activeGroupId, messages])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isLoading || !activeGroupId) return

    const newMessages: AdvisorChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      const res = await askFinancialAdvisorAction({
        message: text,
        conversationHistory: newMessages.slice(1), // Abaikan pesan greeting awal
        workspaceId: activeGroupId,
      })

      if (res.success && res.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.reply as string },
        ])
        setAdvisorMeta(res)
        if (res.suggestedFollowUps && res.suggestedFollowUps.length > 0) {
          setSuggestedQuestions(res.suggestedFollowUps)
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              res.error ||
              'Maaf, terjadi kendala saat menganalisis. Silakan coba tanyakan kembali.',
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Terjadi gangguan jaringan saat menghubungi Nabu AI.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Obrolan telah dibersihkan. Ada yang ingin kamu diskusikan seputar target tabunganmu?',
      },
    ])
    setSuggestedQuestions([
      '📊 Analisis performa tabungan saya saat ini',
      '🎯 Target mana yang paling mendesak untuk diselesaikan?',
      '💡 Bagaimana strategi menabung realistis tiap bulan?',
    ])
  }

  // Format simple markdown into JSX
  const renderFormattedContent = (content: string) => {
    return content.split('\n\n').map((paragraph, idx) => {
      // List item checking
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ') || /^\d+\.\s/.test(paragraph)) {
        const items = paragraph.split('\n')
        return (
          <ul key={idx} className="my-1.5 list-disc pl-4 space-y-1 text-slate-200">
            {items.map((it, i) => {
              const cleanItem = it.replace(/^[-*]\s+|\d+\.\s+/, '')
              return (
                <li key={i}>
                  <FormattedInline text={cleanItem} />
                </li>
              )
            })}
          </ul>
        )
      }

      return (
        <p key={idx} className="my-1 text-slate-200 leading-relaxed">
          <FormattedInline text={paragraph} />
        </p>
      )
    })
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-gradient-to-r from-[#111827] to-[#0A1120] px-4 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-950/40 backdrop-blur-md transition-all hover:scale-105 hover:border-emerald-400 hover:shadow-emerald-900/50 cursor-pointer"
          title="Buka Konsultan Finansial AI (Tanya Nabu)"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Bot className="h-4 w-4 text-emerald-300 transition-transform group-hover:rotate-12" />
          </div>
          <span className="hidden sm:inline">Tanya Nabu</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
            <Sparkles className="h-2.5 w-2.5" /> AI
          </span>
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border border-slate-900" />
        </button>
      </div>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Drawer Content */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-[#0E131F] border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out text-slate-100 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 p-4 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30">
              <Bot className="h-5 w-5 text-emerald-400" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#111827]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">Nabu — AI Financial Advisor</h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Workspace: <span className="text-emerald-400 font-semibold">{activeGroup?.name || 'Personal'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearChat}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Bersihkan Percakapan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Tutup Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Health Status Ribbon */}
        {advisorMeta?.healthSummary && (
          <div className="border-b border-slate-800 bg-emerald-500/5 px-4 py-2 text-xs flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>Status Finansial:</span>
            </span>
            <span className="font-semibold text-emerald-400">
              {advisorMeta.healthSummary}
            </span>
          </div>
        )}

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={idx}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                      : 'bg-[#151C2C] border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {isUser ? m.content : renderFormattedContent(m.content)}
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-[#151C2C] px-3.5 py-2 text-slate-300">
                <span>Nabu sedang menganalisis data tabunganmu...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Follow-up Questions */}
        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="px-4 py-2 border-t border-slate-800/80 bg-[#111827]/50 space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Pertanyaan yang disarankan:
            </span>
            <div className="flex flex-col gap-1">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#151C2C] px-2.5 py-1.5 text-left text-[11px] text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <span className="truncate">{q}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Field */}
        <div className="p-4 border-t border-slate-800 bg-[#111827]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tanya Nabu tentang strategi tabunganmu..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-800 bg-[#0A0E18] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

/**
 * Format inline bold **text** in assistant markdown
 */
function FormattedInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-emerald-300">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
