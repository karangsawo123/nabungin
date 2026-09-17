'use server'

import { createClient } from '@/lib/supabase/server'
import { getGoalsByWorkspace } from '@/actions/goals'
import { getCategoriesByWorkspace } from '@/actions/categories'
import { parseTransactionWithGroq } from '@/lib/ai/groq'
import { parseTransactionWithGemini } from '@/lib/ai/gemini'
import {
  parseTransactionWithLocalNLP,
  type ParsedTransactionResult,
} from '@/lib/ai/fallback-parser'

export interface QuickAddParseInput {
  prompt: string
  workspaceId: string
  customApiKey?: string
}

export interface QuickAddParseResponse {
  success: boolean
  data?: ParsedTransactionResult
  error?: string
  hasApiKeyConfigured: boolean
  providerName: string
}

/**
 * Server Action untuk mengekstrak transaksi dari kalimat bahasa alami
 * Mendukung Groq AI (Llama 3.3 / GPT-OSS) & Google Gemini AI dengan fallback ke Smart Local NLP.
 */
export async function parseQuickAddTransactionAction(
  input: QuickAddParseInput
): Promise<QuickAddParseResponse> {
  const cleanPrompt = input.prompt.trim()
  const hasServerKey = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY)

  if (!cleanPrompt) {
    return {
      success: false,
      error: 'Harap masukkan kalimat transaksi.',
      hasApiKeyConfigured: hasServerKey,
      providerName: 'None',
    }
  }

  if (!input.workspaceId) {
    return {
      success: false,
      error: 'Workspace aktif tidak ditemukan.',
      hasApiKeyConfigured: hasServerKey,
      providerName: 'None',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: 'Sesi login berakhir. Silakan login kembali.',
      hasApiKeyConfigured: hasServerKey,
      providerName: 'None',
    }
  }

  // Ambil goals & categories untuk ruang tabungan ini
  const [goals, categories] = await Promise.all([
    getGoalsByWorkspace(input.workspaceId),
    getCategoriesByWorkspace(input.workspaceId),
  ])

  if (goals.length === 0) {
    return {
      success: false,
      error: 'Belum ada target tabungan di workspace ini. Buat target terlebih dahulu!',
      hasApiKeyConfigured: hasServerKey,
      providerName: 'None',
    }
  }

  const userCustomKey = input.customApiKey?.trim()

  // 1. Cek Groq AI (baik dari custom key yang diawali "gsk_" atau dari .env.local GROQ_API_KEY)
  const groqKey =
    userCustomKey?.startsWith('gsk_')
      ? userCustomKey
      : process.env.GROQ_API_KEY

  if (groqKey) {
    try {
      const groqResult = await parseTransactionWithGroq(
        cleanPrompt,
        goals,
        categories,
        groqKey
      )
      if (groqResult) {
        return {
          success: true,
          data: groqResult,
          hasApiKeyConfigured: true,
          providerName: 'Groq Llama 3.3 / GPT-OSS (Fast)',
        }
      }
    } catch (err) {
      console.warn('[Smart Quick-Add] Groq error, trying next provider:', err)
    }
  }

  // 2. Cek Google Gemini AI (dari custom key atau .env.local GEMINI_API_KEY)
  const geminiKey =
    userCustomKey && !userCustomKey.startsWith('gsk_')
      ? userCustomKey
      : process.env.GEMINI_API_KEY

  if (geminiKey) {
    try {
      const geminiResult = await parseTransactionWithGemini(
        cleanPrompt,
        goals,
        categories,
        geminiKey
      )
      if (geminiResult) {
        return {
          success: true,
          data: geminiResult,
          hasApiKeyConfigured: true,
          providerName: 'Google Gemini 2.5 Flash',
        }
      }
    } catch (err) {
      console.warn('[Smart Quick-Add] Gemini error, falling back to local NLP:', err)
    }
  }

  // 3. Fallback otomatis ke Smart Local NLP Parser
  const localResult = parseTransactionWithLocalNLP(cleanPrompt, goals, categories)

  return {
    success: true,
    data: localResult,
    hasApiKeyConfigured: hasServerKey,
    providerName: 'Smart Local NLP Parser',
  }
}
