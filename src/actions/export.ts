'use server'

import { createClient } from '@/lib/supabase/server'
import type { TransactionFilters } from '@/actions/transactions'

export interface ExportCsvResult {
  success: boolean
  csvData?: string
  filename?: string
  error?: string
}

/**
 * Meng-export riwayat transaksi ke format CSV secara aman dengan RLS & membership verification.
 */
export async function exportTransactionsCsvAction(
  workspaceId: string,
  filters?: TransactionFilters
): Promise<ExportCsvResult> {
  try {
    const supabase = await createClient()

    // 1. Verifikasi autentikasi user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
    }

    // 2. Verifikasi keanggotaan workspace
    const { data: member } = await supabase
      .from('group_members')
      .select('id, groups(name)')
      .eq('group_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      return { success: false, error: 'Anda tidak memiliki akses ke ruang tabungan ini.' }
    }

    const groupName =
      (member.groups as unknown as { name: string })?.name || 'Nabungin-Workspace'

    // 3. Ambil goals dalam workspace ini
    const { data: workspaceGoals } = await supabase
      .from('goals')
      .select('id')
      .eq('group_id', workspaceId)

    if (!workspaceGoals || workspaceGoals.length === 0) {
      return {
        success: true,
        csvData: 'Tanggal,Tipe,Nominal,Target Tabungan,Pos Kategori,Dicatat Oleh,Catatan\n',
        filename: `transaksi-${groupName.toLowerCase().replace(/\s+/g, '-')}.csv`,
      }
    }

    const goalIds = workspaceGoals.map((g) => g.id)

    // 4. Query transaksi
    let query = supabase
      .from('transactions')
      .select(
        `
        id,
        type,
        amount,
        notes,
        transaction_date,
        created_at,
        goals (id, name),
        categories (id, name),
        profiles (id, full_name)
      `
      )
      .in('goal_id', goalIds)
      .order('transaction_date', { ascending: false })

    if (filters?.goalId && filters.goalId !== 'all') {
      query = query.eq('goal_id', filters.goalId)
    }

    if (filters?.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId)
    }

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    const { data: transactions, error: txError } = await query

    if (txError) {
      return { success: false, error: txError.message || 'Gagal mengambil data transaksi.' }
    }

    // 5. Format menjadi CSV RFC 4180
    const escapeCsvField = (field: string | number | null | undefined): string => {
      if (field === null || field === undefined) return '""'
      const str = String(field)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return `"${str}"`
    }

    const headers = [
      'Tanggal',
      'Tipe',
      'Nominal (IDR)',
      'Target Tabungan',
      'Pos Kategori',
      'Dicatat Oleh',
      'Catatan',
    ]

    const rows = (transactions || []).map((t) => {
      const typeLabel = t.type === 'deposit' ? 'Setoran' : 'Penarikan'
      const goalName = (t.goals as unknown as { name: string })?.name || '-'
      const catName = (t.categories as unknown as { name: string })?.name || '-'
      const userName = (t.profiles as unknown as { full_name: string })?.full_name || '-'
      const date = t.transaction_date || t.created_at?.split('T')[0] || '-'

      return [
        escapeCsvField(date),
        escapeCsvField(typeLabel),
        t.amount,
        escapeCsvField(goalName),
        escapeCsvField(catName),
        escapeCsvField(userName),
        escapeCsvField(t.notes || '-'),
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const safeDate = new Date().toISOString().split('T')[0]
    const filename = `transaksi-${groupName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${safeDate}.csv`

    return {
      success: true,
      csvData: csvContent,
      filename,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat export.',
    }
  }
}
