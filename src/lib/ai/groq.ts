import type { Goal, Category } from '@/types/database'
import type { ParsedTransactionResult } from './fallback-parser'

export async function parseTransactionWithGroq(
  prompt: string,
  goals: Goal[],
  categories: Category[],
  apiKey?: string
): Promise<ParsedTransactionResult | null> {
  const key = apiKey || process.env.GROQ_API_KEY
  if (!key) return null

  const goalsContext = goals
    .map(
      (g) =>
        `- ID: "${g.id}", Nama: "${g.name}", Target: Rp ${g.target_amount.toLocaleString('id-ID')}, Saldo Saat Ini: Rp ${g.current_amount.toLocaleString('id-ID')}`
    )
    .join('\n')

  const categoriesContext = categories
    .map((c) => `- ID: "${c.id}", Nama: "${c.name}"`)
    .join('\n')

  const systemMessage = `Kamu adalah asisten AI keuangan pintar di Nabungin.
Tugasmu: Ekstrak data transaksi dari kalimat bahasa alami Indonesia pengguna ke format JSON.
Aturan:
- Pahami istilah angka Indonesia: 50k = 50000, 150rb = 150000, 1.5jt = 1500000, 200.000 = 200000.
- Tipe: "deposit" (setor, nabung, masuk, tambah, simpan) atau "withdrawal" (tarik, ambil, beli, bayar, pake, keluar).
- goalId: Pilih salah satu ID dari daftar target tabungan yang paling sesuai konteks. Jika tidak ada yang cocok, gunakan ID: "${goals[0]?.id || ''}".
- categoryId: Pilih salah satu ID dari daftar kategori pos yang paling sesuai konteks. Jika tidak ada yang cocok, gunakan ID: "${categories[0]?.id || ''}".
- notes: ringkasan keterangan/keperluan (maks 60 karakter).
- explanation: penjelasan singkat dalam bahasa Indonesia mengapa memilih nominal, tipe, dan target tersebut.

Daftar Target Tabungan Pengguna:
${goalsContext || '(Belum ada target)'}

Daftar Kategori Pengguna:
${categoriesContext || '(Belum ada kategori)'}

Wajib kembalikan format JSON murni:
{
  "amount": 150000,
  "type": "deposit",
  "goalId": "...",
  "categoryId": "...",
  "notes": "...",
  "explanation": "..."
}`

  const modelsToTry = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']

  for (const model of modelsToTry) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      })

      if (!res.ok) {
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) continue

      const parsed = JSON.parse(content)

      const validGoalId = goals.some((g) => g.id === parsed.goalId)
        ? parsed.goalId
        : goals[0]?.id || ''

      const validCategoryId = categories.some((c) => c.id === parsed.categoryId)
        ? parsed.categoryId
        : categories[0]?.id || ''

      return {
        amount: Math.abs(Number(parsed.amount)) || 50000,
        type: parsed.type === 'withdrawal' ? 'withdrawal' : 'deposit',
        goalId: validGoalId,
        categoryId: validCategoryId,
        notes: (parsed.notes || prompt).slice(0, 150),
        explanation: parsed.explanation || 'Berhasil dianalisis dengan AI (Groq Fast Inference).',
        provider: 'groq' as any,
        confidence: 'high',
      }
    } catch (err) {
      console.warn(`[Groq Model ${model} Attempt Failed]:`, err)
    }
  }

  return null
}
