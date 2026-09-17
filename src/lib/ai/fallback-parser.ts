import type { Goal, Category, TransactionType } from '@/types/database'

export interface ParsedTransactionResult {
  amount: number
  type: TransactionType
  goalId: string
  categoryId: string
  notes: string
  explanation: string
  provider: 'groq' | 'gemini' | 'openai' | 'local_nlp'
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Parsing angka dalam format khas Indonesia:
 * - 150k, 150rb, 150 ribu -> 150000
 * - 1.5jt, 1.5 juta -> 1500000
 * - Rp 250.000, 250000 -> 250000
 */
export function parseIndonesianAmount(text: string): number | null {
  const clean = text.toLowerCase().replace(/rp\.?/g, '').trim()

  // Pola: 1.5jt atau 1,5 juta atau 2jt
  const jutaMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/)
  if (jutaMatch) {
    const val = parseFloat(jutaMatch[1].replace(',', '.'))
    if (!isNaN(val)) return Math.round(val * 1000000)
  }

  // Pola: 150k atau 150rb atau 150 ribu
  const ribuMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu)\b/)
  if (ribuMatch) {
    const val = parseFloat(ribuMatch[1].replace(',', '.'))
    if (!isNaN(val)) return Math.round(val * 1000)
  }

  // Pola: angka dengan titik pemisah ribuan (misal: 250.000 atau 1.000.000)
  const standardNumberWithDots = clean.match(/\b(\d{1,3}(?:\.\d{3})+)\b/)
  if (standardNumberWithDots) {
    const val = parseInt(standardNumberWithDots[1].replace(/\./g, ''), 10)
    if (!isNaN(val)) return val
  }

  // Pola: angka biasa (misal: 50000)
  const plainMatch = clean.match(/\b(\d{4,12})\b/)
  if (plainMatch) {
    const val = parseInt(plainMatch[1], 10)
    if (!isNaN(val)) return val
  }

  return null
}

/**
 * Parser lokal berbasis aturan bahasa alami Indonesia untuk fallback offline/tanpa API Key
 */
export function parseTransactionWithLocalNLP(
  text: string,
  goals: Goal[],
  categories: Category[]
): ParsedTransactionResult {
  const lower = text.toLowerCase()

  // 1. Tentukan Tipe Transaksi
  const withdrawalKeywords = ['tarik', 'ambil', 'keluar', 'pake', 'pakai', 'beli', 'bayar', 'belanja']
  const isWithdrawal = withdrawalKeywords.some((kw) => lower.includes(kw))
  const type: TransactionType = isWithdrawal ? 'withdrawal' : 'deposit'

  // 2. Ekstrak Nominal
  const amount = parseIndonesianAmount(lower) || 50000

  // 3. Cocokkan Target Goal
  let matchedGoal: Goal | undefined
  let highestGoalScore = 0

  for (const goal of goals) {
    const goalLower = goal.name.toLowerCase()
    // Exact word or substring match
    if (lower.includes(goalLower)) {
      matchedGoal = goal
      highestGoalScore = 100
      break
    }
    // Partial word match
    const words = goalLower.split(/\s+/).filter((w) => w.length > 2)
    let score = 0
    for (const w of words) {
      if (lower.includes(w)) score += 20
    }
    if (score > highestGoalScore) {
      highestGoalScore = score
      matchedGoal = goal
    }
  }

  const finalGoal = matchedGoal || goals[0]

  // 4. Cocokkan Kategori
  let matchedCategory: Category | undefined
  let highestCatScore = 0

  for (const cat of categories) {
    const catLower = cat.name.toLowerCase()
    if (lower.includes(catLower)) {
      matchedCategory = cat
      highestCatScore = 100
      break
    }
    const words = catLower.split(/\s+/).filter((w) => w.length > 2)
    let score = 0
    for (const w of words) {
      if (lower.includes(w)) score += 20
    }
    if (score > highestCatScore) {
      highestCatScore = score
      matchedCategory = cat
    }
  }

  // Keyword heuristic tambahan untuk kategori umum
  if (!matchedCategory) {
    if (lower.includes('makan') || lower.includes('jajan') || lower.includes('kuliner')) {
      matchedCategory = categories.find((c) => /makan|kuliner|pangan/i.test(c.name))
    } else if (lower.includes('jalan') || lower.includes('liburan') || lower.includes('tiket')) {
      matchedCategory = categories.find((c) => /liburan|wisata|hiburan/i.test(c.name))
    } else if (lower.includes('gaji') || lower.includes('bonus') || lower.includes('saku')) {
      matchedCategory = categories.find((c) => /pemasukan|gaji|pokok/i.test(c.name))
    }
  }

  const finalCategory = matchedCategory || categories[0]

  // 5. Ekstrak Catatan (Notes)
  let notes = text.trim()
  const catatanMatch = text.match(/(?:catatan|untuk|buat|keterangan)[:\s]+([^,.]+)/i)
  if (catatanMatch && catatanMatch[1]) {
    notes = catatanMatch[1].trim()
  } else {
    // Bersihkan kata kunci umum untuk membuat catatan lebih rapi
    notes = text
      .replace(/(?:setor|nabung|tarik|ambil|simpan|bayar)\s+[0-9a-zA-Z.,]+/gi, '')
      .replace(/(?:ke|dari|untuk|buat)\s+tabungan\s+[a-zA-Z0-9]+/gi, '')
      .trim()
    if (!notes || notes.length < 3) {
      notes = type === 'deposit' ? `Setoran via Smart Quick-Add` : `Penarikan via Smart Quick-Add`
    }
  }

  return {
    amount,
    type,
    goalId: finalGoal?.id || '',
    categoryId: finalCategory?.id || '',
    notes: notes.slice(0, 150),
    explanation: `Terdeteksi ${type === 'deposit' ? 'Setoran' : 'Penarikan'} sebesar Rp ${amount.toLocaleString('id-ID')} ke target "${finalGoal?.name || 'Tabungan'}" (Kategori: ${finalCategory?.name || 'Umum'}).`,
    provider: 'local_nlp',
    confidence: highestGoalScore > 50 ? 'high' : 'medium',
  }
}
