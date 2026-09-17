import { GoogleGenAI } from '@google/genai'
import type { Goal, Category } from '@/types/database'
import type { ParsedTransactionResult } from './fallback-parser'

export async function parseTransactionWithGemini(
  prompt: string,
  goals: Goal[],
  categories: Category[],
  apiKey?: string
): Promise<ParsedTransactionResult | null> {
  const key = apiKey || process.env.GEMINI_API_KEY
  if (!key) return null

  const ai = new GoogleGenAI({ apiKey: key })

  const goalsContext = goals
    .map(
      (g) =>
        `- ID: "${g.id}", Nama: "${g.name}", Target: Rp ${g.target_amount.toLocaleString('id-ID')}, Saldo Saat Ini: Rp ${g.current_amount.toLocaleString('id-ID')}`
    )
    .join('\n')

  const categoriesContext = categories
    .map((c) => `- ID: "${c.id}", Nama: "${c.name}"`)
    .join('\n')

  const systemInstruction = `Kamu adalah asisten keuangan cerdas Nabungin. Tugasmu adalah mengekstrak data transaksi tabungan dari kalimat bahasa alami pengguna ke format JSON terstruktur.
Pengguna menggunakan bahasa Indonesia (termasuk bahasa sehari-hari/gaul seperti 50k = 50.000, 100rb = 100.000, 1.5jt = 1.500.000, setor/nabung = deposit, tarik/ambil/beli = withdrawal).

Daftar Target Tabungan Pengguna:
${goalsContext || '(Belum ada target)'}

Daftar Kategori Pengguna:
${categoriesContext || '(Belum ada kategori)'}

Aturan ekstraksi:
1. "amount": integer positif dalam mata uang Rupiah.
2. "type": harus "deposit" (setor) atau "withdrawal" (tarik).
3. "goalId": harus salah satu ID dari daftar Target di atas yang paling sesuai dengan konteks kalimat. Jika tidak disebutkan jelas, pilih ID target pertama yang tersedia.
4. "categoryId": harus salah satu ID dari daftar Kategori di atas yang paling sesuai. Jika tidak disebutkan, pilih ID kategori paling relevan.
5. "notes": ringkasan singkat keterangan atau keperluan transaksi (maksimal 80 karakter).
6. "explanation": penjelasan singkat dalam bahasa Indonesia santai mengenai hasil ekstraksi.
7. Output WAJIB berupa JSON murni.`

  try {
    // Coba model gemini-2.5-flash terlebih dahulu, fallback ke gemini-1.5-flash jika diperlukan
    let responseText = ''
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      })
      responseText = response.text || ''
    } catch {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      })
      responseText = response.text || ''
    }

    if (!responseText) return null

    // Bersihkan karakter formatting jika ada
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validasi apakah goalId dan categoryId yang dikembalikan valid
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
      explanation: parsed.explanation || 'Berhasil dianalisis dengan Gemini AI.',
      provider: 'gemini',
      confidence: 'high',
    }
  } catch (err) {
    console.error('[Gemini AI Parse Error]:', err)
    return null
  }
}
