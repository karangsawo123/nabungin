'use server'

import { createClient } from '@/lib/supabase/server'
import { getGoalsByWorkspace } from '@/actions/goals'
import { getTransactionsByWorkspace } from '@/actions/transactions'
import { getCategoriesByWorkspace } from '@/actions/categories'
import { formatRupiah } from '@/lib/utils'

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
  error?: string
  providerName?: string
}

/**
 * Server Action: Konsultasi Finansial dengan AI Advisor "Nabu"
 * Membaca ringkasan agregasi keuangan workspace secara aman dan memberikan
 * analisis serta rekomendasi perencanaan tabungan personal/grup.
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

  // Filter 30 hari terakhir
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
  } else if (recentWithdrawals > recentDeposits && recentDeposits > 0) {
    health = 'warning'
    healthSummary = 'Pengeluaran Melebihi Setoran (30 Hari) 🔻'
    score = 50
  } else if (overallProgress >= 75 || netSavings30Days > 1000000) {
    health = 'excellent'
    healthSummary = 'Pertumbuhan Tabungan Sangat Baik! 🚀'
    score = 90
  }

  // Rangkum konteks untuk AI
  const goalsSummary = goals
    .map((g, idx) => {
      const progress =
        g.target_amount > 0
          ? Math.round(((Number(g.current_amount) || 0) / Number(g.target_amount)) * 100)
          : 0
      const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount))
      return `${idx + 1}. "${g.name}": Terkumpul ${formatRupiah(g.current_amount)} dari target ${formatRupiah(g.target_amount)} (${progress}% tercapai). Sisa kebutuhan: ${formatRupiah(remaining)}.${g.deadline ? ` Batas waktu: ${g.deadline}.` : ''}`
    })
    .join('\n')

  const systemPrompt = `Kamu adalah "Nabu", Konsultan Finansial & Tabungan Pribadi resmi di aplikasi Nabungin.
Karaktermu: Sangat ramah, solutif, empatik, berbasis data riil, dan memberikan langkah konkret (actionable steps) dalam bahasa Indonesia santai namun profesional.

Konteks Finansial Nyata Pengguna Saat Ini di Ruang Tabungan:
- Total Akumulasi Tabungan: ${formatRupiah(totalBalance)}
- Total Target Keseluruhan: ${formatRupiah(totalTarget)} (Progres Total: ${overallProgress}%)
- Mutasi 30 Hari Terakhir:
  * Total Setoran (+): ${formatRupiah(recentDeposits)}
  * Total Penarikan (-): ${formatRupiah(recentWithdrawals)}
  * Tabungan Bersih: ${formatRupiah(netSavings30Days)}
- Jumlah Target Tabungan Aktif: ${goals.length} target
Daftar Target:
${goalsSummary || '(Belum ada target tabungan yang dibuat)'}

Aturan Menjawab:
1. Jawab pertanyaan pengguna dengan menganalisis data riil di atas secara cerdas.
2. Berikan angka estimasi yang logis (misal: nominal yang perlu disetor per minggu/bulan, estimasi waktu pencapaian).
3. Gunakan formatting Markdown yang mudah dibaca (bullet points, bold untuk angka penting, dan emoji secukupnya).
4. Jangan memberikan rekomendasi instrumen investasi berisiko tinggi (kripto/saham gorengan). Fokus pada disiplin menabung, dana darurat, dan alokasi realistis.
5. Panjang jawaban proporsional (ringkas, padat, dan menyenangkan dibaca).`

  const apiKey =
    input.customApiKey?.trim() ||
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY

  // 1. Coba Groq AI jika ada
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
        input.conversationHistory.slice(-4).forEach((h) => {
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
          max_tokens: 800,
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
            suggestedFollowUps: generateFollowUps(goals),
            providerName: 'Groq Llama 3.3 / GPT-OSS',
          }
        }
      }
    } catch (err) {
      console.warn('[AI Advisor Groq Error]:', err)
    }
  }

  // 2. Fallback Heuristik Lokal jika API offline
  const fallbackReply = generateLocalAdvisorAdvice(cleanMessage, goals, totalBalance, totalTarget)

  return {
    success: true,
    reply: fallbackReply,
    financialHealth: health,
    healthScore: score,
    healthSummary,
    suggestedFollowUps: generateFollowUps(goals),
    providerName: 'Nabu Smart Advisor (Local Engine)',
  }
}

/**
 * Generate pertanyaan lanjutan yang relevan dengan target pengguna
 */
function generateFollowUps(goals: Array<{ name: string }>): string[] {
  const firstName = goals[0]?.name || 'Target Utama'
  return [
    `Berapa setoran mingguan ideal untuk ${firstName}?`,
    'Bagaimana cara membagi porsi tabungan jika ada pengeluaran tak terduga?',
    'Buatkan strategi disiplin menabung 30 hari ke depan',
  ]
}

/**
 * Fallback penasihat keuangan lokal
 */
function generateLocalAdvisorAdvice(
  message: string,
  goals: Array<{ name: string; current_amount: number; target_amount: number }>,
  totalBalance: number,
  totalTarget: number
): string {
  const firstGoal = goals[0]
  if (!firstGoal) {
    return `Halo! Saya **Nabu**, konsultan tabungan pribadimu di Nabungin. 

Saat ini kamu belum memiliki target tabungan aktif di ruang ini. Langkah terbaik pertama adalah **membuat satu target spesifik** (misalnya *Dana Darurat* atau *Liburan*). Setelah ada target, saya dapat membantumu menghitung jadwal setoran yang paling realistis!`
  }

  const sisa = Math.max(0, Number(firstGoal.target_amount) - Number(firstGoal.current_amount))
  const cicil6Bulan = Math.round(sisa / 6)
  const cicilMingguan = Math.round(sisa / 24)

  return `Halo! Berdasarkan data tabunganmu saat ini:
- **Total Saldo Terkumpul**: ${formatRupiah(totalBalance)}
- **Target Terdekat**: "${firstGoal.name}" (${formatRupiah(firstGoal.current_amount)} / ${formatRupiah(firstGoal.target_amount)})
- **Sisa yang dibutuhkan**: ${formatRupiah(sisa)}

💡 **Rekomendasi Strategi Nabu:**
1. Untuk melunasi sisa target dalam **6 bulan**, sisihkan sekitar **${formatRupiah(cicil6Bulan)} / bulan** (atau sekitar **${formatRupiah(cicilMingguan)} / minggu**).
2. Terapkan metode *Pay Yourself First* — sisihkan dana tabungan di hari pertama menerima pemasukan sebelum dialokasikan untuk kebutuhan sekunder.
3. Manfaatkan fitur **⚡ Smart Quick-Add** untuk segera mencatat setiap sisa uang harian agar tabungan terus bertambah tanpa terasa memberatkan!`
}
