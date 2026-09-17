'use server'

import { createClient } from '@/lib/supabase/server'
import { getGoalsByWorkspace } from '@/actions/goals'
import { getTransactionsByWorkspace } from '@/actions/transactions'
import { getCategoriesByWorkspace } from '@/actions/categories'
import { formatRupiah } from '@/lib/utils'
import type { Goal } from '@/types/database'
import {
  calculateClosestGoal,
  type ClosestGoalInfo,
} from '@/lib/ai/advisor-helpers'

export type { ClosestGoalInfo }

export interface AdvisorChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AskAdvisorInput {
  message: string
  conversationHistory?: AdvisorChatMessage[]
  workspaceId: string
  customApiKey?: string
}

export interface AdvisorResponse {
  success: boolean
  reply?: string
  financialHealth?: 'excellent' | 'good' | 'needs_attention' | 'warning'
  healthScore?: number
  healthSummary?: string
  suggestedFollowUps?: string[]
  closestGoal?: ClosestGoalInfo | null
  error?: string
  providerName?: string
}

function todayZero(d: Date) {
  d.setHours(0, 0, 0, 0)
}

/**
 * Server Action: Konsultasi Finansial dengan AI Advisor "Nabu"
 * Diperkaya pengetahuan finansial luas dan perhitungan deadline terdekat
 */
export async function askFinancialAdvisorAction(
  input: AskAdvisorInput
): Promise<AdvisorResponse> {
  const cleanMessage = input.message.trim()
  if (!cleanMessage) {
    return { success: false, error: 'Pesan konsultasi tidak boleh kosong.' }
  }

  if (!input.workspaceId) {
    return { success: false, error: 'Ruang tabungan aktif tidak ditemukan.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi login berakhir. Silakan login kembali.' }
  }

  // 1. Ambil data agregasi keuangan workspace
  const [goals, transactions, categories] = await Promise.all([
    getGoalsByWorkspace(input.workspaceId),
    getTransactionsByWorkspace(input.workspaceId),
    getCategoriesByWorkspace(input.workspaceId),
  ])

  const totalTarget = goals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0)
  const totalBalance = goals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0)
  const overallProgress = totalTarget > 0 ? Math.round((totalBalance / totalTarget) * 100) : 0

  // 2. Analisis Target Deadline Terdekat
  const closestGoal = calculateClosestGoal(goals)

  // 3. Filter transaksi 30 hari terakhir
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const recentTx = transactions.filter((tx) => new Date(tx.created_at) >= thirtyDaysAgo)
  const recentDeposits = recentTx
    .filter((tx) => tx.type === 'deposit')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

  const recentWithdrawals = recentTx
    .filter((tx) => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

  const netSavings30Days = recentDeposits - recentWithdrawals

  // Evaluasi skor kesehatan finansial
  let health: 'excellent' | 'good' | 'needs_attention' | 'warning' = 'good'
  let healthSummary = 'Kondisi Tabungan Cukup Sehat 🟢'
  let score = 75

  if (goals.length === 0) {
    health = 'needs_attention'
    healthSummary = 'Belum Ada Target Aktif ⚠️'
    score = 40
  } else if (closestGoal && closestGoal.status === 'urgent') {
    health = 'needs_attention'
    healthSummary = `Target "${closestGoal.name}" Mendekati Batas Waktu! ⏳`
    score = 65
  } else if (recentWithdrawals > recentDeposits && recentDeposits > 0) {
    health = 'warning'
    healthSummary = 'Pengeluaran Melebihi Setoran (30 Hari) 🔻'
    score = 50
  } else if (overallProgress >= 75 || netSavings30Days > 1000000) {
    health = 'excellent'
    healthSummary = 'Pertumbuhan Tabungan Sangat Baik! 🚀'
    score = 90
  }

  // Rangkum seluruh target
  const goalsSummary = goals
    .map((g, idx) => {
      const progress =
        g.target_amount > 0
          ? Math.round(((Number(g.current_amount) || 0) / Number(g.target_amount)) * 100)
          : 0
      const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount))
      return `${idx + 1}. "${g.name}": Terkumpul ${formatRupiah(g.current_amount)} / ${formatRupiah(g.target_amount)} (${progress}% tercapai). Sisa: ${formatRupiah(remaining)}.${g.deadline ? ` Batas Waktu: ${g.deadline}.` : ' (Belum ada deadline spesifik).'}`
    })
    .join('\n')

  // Rangkum info prioritas deadline terdekat untuk prompt
  let deadlinePromptContext = 'Saat ini belum ada target dengan batas waktu spesifik.'
  if (closestGoal) {
    deadlinePromptContext = `
🔥 TARGET DENGAN DEADLINE TERDEKAT (PRIORITAS NOMOR 1):
- Nama Target: "${closestGoal.name}"
- Saldo Saat Ini: ${formatRupiah(closestGoal.currentAmount)}
- Target Total: ${formatRupiah(closestGoal.targetAmount)}
- Sisa Nominal yang Dibutuhkan: ${formatRupiah(closestGoal.remainingAmount)}
- Batas Waktu: ${closestGoal.deadline ? `${closestGoal.deadline} (Sisa ${closestGoal.remainingDays} hari)` : 'Estimasi horizon 90 hari'}
- REKOMENDASI NOMINAL TABUNGAN AGAR TEPAT WAKTU:
  * SETORAN PER HARI: ${formatRupiah(closestGoal.dailyRequired)} / hari
  * SETORAN PER MINGGU: ${formatRupiah(closestGoal.weeklyRequired)} / minggu
  * SETORAN PER BULAN: ${formatRupiah(closestGoal.monthlyRequired)} / bulan
- Status Waktu: ${closestGoal.status === 'urgent' ? 'SANGAT MENDESAK (< 30 hari) ⚠️' : closestGoal.status === 'moderate' ? 'SEDANG (30-90 hari)' : 'CUKUP LONGGAR (> 90 hari)'}`
  }

  // System Prompt komprehensif dengan perluasan domain finansial
  const systemPrompt = `Kamu adalah "Nabu", Konsultan Finansial & Tabungan Pribadi cerdas, empatik, dan interaktif di aplikasi Nabungin.
Karaktermu:
- Sangat komunikatif, bersahabat, berbasis data nyata, dan memberikan solusi yang realistis untuk masyarakat Indonesia.
- Menguasai berbagai metodologi perencanaan keuangan modern: Aturan 50/30/20, Micro-saving/Kaizen (nabung receh harian), Sinking Funds, Zero-based Budgeting, Dana Darurat sesuai tanggungan, dan manajemen keuangan kolaboratif/grup.

=======================================================
📊 DATA KEUANGAN PENGGUNA SAAT INI (DATA RIIL):
- Total Akumulasi Saldo Tabungan: ${formatRupiah(totalBalance)}
- Total Target Keseluruhan: ${formatRupiah(totalTarget)} (Progres Total: ${overallProgress}%)
- Mutasi 30 Hari Terakhir:
  * Total Setoran (+): ${formatRupiah(recentDeposits)}
  * Total Penarikan (-): ${formatRupiah(recentWithdrawals)}
  * Tabungan Bersih: ${formatRupiah(netSavings30Days)}
- Jumlah Target Tabungan Aktif: ${goals.length} target

${deadlinePromptContext}

Daftar Seluruh Target Tabungan:
${goalsSummary || '(Belum ada target tabungan yang dibuat)'}

Daftar Pos Kategori Tersedia:
${categories.map((c) => `- ${c.name}`).join(', ') || 'Umum, Kebutuhan Pokok, Tabungan'}
=======================================================

🧠 PENGETAHUAN & ATURAN KHUSUS NABU:
1. PRIORITAS DEADLINE TERDEKAT:
   - Jika pengguna bertanya tentang "rekomendasi nabung", "strategi", "apa yang harus diselesaikan dulu", atau "berapa harus nabung":
     WAJIB mengangkat target dengan deadline terdekat di atas sebagai prioritas utama!
     Sebutkan secara eksplisit rekomendasi setoran **per hari (${closestGoal ? formatRupiah(closestGoal.dailyRequired) : 'Rp ...'})** atau **per minggu (${closestGoal ? formatRupiah(closestGoal.weeklyRequired) : 'Rp ...'})** agar pengguna punya gambaran langkah kecil harian yang jelas.
2. PERENCANAAN GAJI & ANGGARAN:
   - Jika pengguna bertanya tentang gaji (misal gaji UMR 3-5 juta, atau 10 juta):
     Bantu memecah dengan metode 50/30/20 (50% Kebutuhan, 30% Keinginan, 20% Tabungan/Investasi) atau 70/20/10 jika biaya hidup tinggi.
3. PERBEDAAN SINKING FUND VS DANA DARURAT:
   - Dana Darurat: untuk hal tak terduga (PHK, sakit). Idealnya 3-6x pengeluaran bulanan (lajang) atau 6-12x (berkeluarga).
   - Sinking Fund: tabungan yang sudah terencana waktu dan nominalnya (servis kendaraan, qurban, beli laptop, tiket liburan).
4. TIPS MENGATASI BONCOS & IMPULSE BUYING:
   - Kenalkan aturan jeda 48 jam sebelum membeli barang non-esensial.
   - Sarankan teknik "micro-saving": manfaatkan fitur **⚡ Smart Quick-Add Nabungin** untuk mencatat sisa uang belanjaan harian (10rb - 20rb) agar tabungan tumbuh tanpa terasa berat.
5. GAYA PENULISAN:
   - Gunakan format Markdown yang rapi: gunakan tabel jika membandingkan angka atau opsi waktu, bullet points untuk tips, dan tebalkan angka penting (**Rp ...**).
   - Jangan rekomendasikan investasi berisiko tinggi (kripto spekulatif, saham gorengan).
   - Di akhir jawaban, berikan 1 pertanyaan pemantik santai agar percakapan tetap mengalir secara natural.`

  const apiKey =
    input.customApiKey?.trim() ||
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY

  const groqKey =
    input.customApiKey?.startsWith('gsk_')
      ? input.customApiKey
      : process.env.GROQ_API_KEY

  if (groqKey) {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ]

      if (input.conversationHistory && input.conversationHistory.length > 0) {
        input.conversationHistory.slice(-6).forEach((h) => {
          messages.push({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.content,
          })
        })
      }

      messages.push({ role: 'user', content: cleanMessage })

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages,
          temperature: 0.3,
          max_tokens: 950,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const reply = data.choices?.[0]?.message?.content
        if (reply) {
          return {
            success: true,
            reply: reply.trim(),
            financialHealth: health,
            healthScore: score,
            healthSummary,
            suggestedFollowUps: generateDynamicFollowUps(closestGoal, goals),
            closestGoal,
            providerName: 'Groq Llama 3.3 / GPT-OSS',
          }
        }
      }
    } catch (err) {
      console.warn('[AI Advisor Groq Error]:', err)
    }
  }

  // Fallback Heuristik Lokal
  const fallbackReply = generateLocalAdvisorAdvice(
    cleanMessage,
    goals,
    closestGoal,
    totalBalance,
    totalTarget
  )

  return {
    success: true,
    reply: fallbackReply,
    financialHealth: health,
    healthScore: score,
    healthSummary,
    suggestedFollowUps: generateDynamicFollowUps(closestGoal, goals),
    closestGoal,
    providerName: 'Nabu Smart Advisor (Local Engine)',
  }
}

/**
 * Pertanyaan lanjutan yang adaptif terhadap deadline dan target riil
 */
function generateDynamicFollowUps(
  closestGoal: ClosestGoalInfo | null,
  goals: Goal[]
): string[] {
  if (closestGoal) {
    return [
      `🎯 Berapa harus nabung per hari/minggu untuk "${closestGoal.name}"?`,
      '💡 Bagaimana membagi porsi gaji 5 juta dengan metode 50/30/20?',
      '🛡️ Berapa jumlah dana darurat ideal untuk kondisi saya?',
    ]
  }

  return [
    '🎯 Target mana yang paling mendesak untuk diselesaikan?',
    '💡 Bagaimana strategi menabung harian tanpa terasa berat?',
    '📊 Analisis performa tabungan saya saat ini',
  ]
}

/**
 * Fallback penasihat keuangan lokal yang diperkaya
 */
function generateLocalAdvisorAdvice(
  message: string,
  goals: Goal[],
  closestGoal: ClosestGoalInfo | null,
  totalBalance: number,
  totalTarget: number
): string {
  if (goals.length === 0) {
    return `Halo! Saya **Nabu**, konsultan tabungan pribadimu di Nabungin. 🌿

Saat ini kamu belum memiliki target tabungan aktif di ruang ini. 
Langkah awal terbaik adalah **membuat satu target spesifik** (misalnya *Dana Darurat* atau *Liburan*). Setelah target dibuat, saya dapat menghitung jadwal setoran per hari atau per minggu yang paling realistis!`
  }

  if (closestGoal) {
    return `Halo! Saya telah menganalisis ruang tabunganmu. 

🎯 **Prioritas Utama: Target dengan Batas Waktu Terdekat**
- **Nama Target**: "${closestGoal.name}"
- **Terkumpul**: ${formatRupiah(closestGoal.currentAmount)} dari ${formatRupiah(closestGoal.targetAmount)}
- **Sisa Kebutuhan**: ${formatRupiah(closestGoal.remainingAmount)}
${closestGoal.deadline ? `- **Batas Waktu**: ${closestGoal.deadline} (Sisa **${closestGoal.remainingDays} hari** lagi)` : '- **Horizon Waktu**: 90 hari'}

💡 **Rekomendasi Setoran Tepat Waktu:**
- **Harian**: Sekitar **${formatRupiah(closestGoal.dailyRequired)} / hari**
- **Mingguan**: Sekitar **${formatRupiah(closestGoal.weeklyRequired)} / minggu**
- **Bulanan**: Sekitar **${formatRupiah(closestGoal.monthlyRequired)} / bulan**

✨ **Tips Nabu:**
1. Sisihkan **${formatRupiah(closestGoal.dailyRequired)}** setiap pagi atau sore dengan fitur **⚡ Smart Quick-Add**.
2. Jika ada sisa uang belanja harian, segera masukkan sebagai setoran ekstra agar target tercapai lebih cepat!`
  }

  return `Halo! Total saldo tabunganmu saat ini adalah **${formatRupiah(totalBalance)}** dari total target **${formatRupiah(totalTarget)}**.
Untuk mempercepat pencapaian target, buat jadwal setoran mingguan yang konsisten dan catat mutasi harian secara disiplin!`
}
