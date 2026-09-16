/**
 * Auth Identifier & Username Helpers
 * Mengelola konversi dan validasi username agar pengguna dapat mendaftar dan login
 * murni menggunakan Username tanpa perlu memasukkan email pribadi ke aplikasi.
 */

export const INTERNAL_EMAIL_DOMAIN = '@nabungin.internal'

/**
 * Format input pengguna menjadi identifier autentikasi internal Supabase.
 * - Jika sudah berupa email asli (memiliki '@'), tetap gunakan apa adanya (backward-compatible).
 * - Jika berupa username (misal: 'budi99'), otomatis dipetakan ke 'budi99@nabungin.internal'.
 */
export function formatAuthIdentifier(input: string): string {
  const trimmed = input.trim()
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase()
  }
  return `${trimmed.toLowerCase()}${INTERNAL_EMAIL_DOMAIN}`
}

/**
 * Validasi ketat untuk username:
 * - 3 sampai 30 karakter
 * - Hanya huruf (a-z, A-Z), angka (0-9), garis bawah (_), dan titik (.)
 * - Tidak boleh mengandung '@' atau spasi
 */
export function validateUsername(username: string): { valid: boolean; message?: string } {
  const trimmed = username.trim()
  if (!trimmed) {
    return { valid: false, message: 'Username tidak boleh kosong.' }
  }
  if (trimmed.includes('@')) {
    return { valid: false, message: 'Username tidak perlu menggunakan simbol @.' }
  }
  if (trimmed.includes(' ')) {
    return { valid: false, message: 'Username tidak boleh mengandung spasi.' }
  }
  if (trimmed.length < 3) {
    return { valid: false, message: 'Username minimal 3 karakter.' }
  }
  if (trimmed.length > 30) {
    return { valid: false, message: 'Username maksimal 30 karakter.' }
  }
  const regex = /^[a-zA-Z0-9._]+$/
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      message: 'Username hanya boleh terdiri dari huruf, angka, titik (.), atau garis bawah (_).',
    }
  }
  return { valid: true }
}

/**
 * Memformat identifier untuk tampilan ramah pengguna.
 * Jika berakhiran '@nabungin.internal', sembunyikan domain internal dan tampilkan '@username'.
 */
export function formatDisplayUsername(identifier?: string | null): string {
  if (!identifier) return ''
  if (identifier.endsWith(INTERNAL_EMAIL_DOMAIN)) {
    return `@${identifier.replace(INTERNAL_EMAIL_DOMAIN, '')}`
  }
  return identifier
}
