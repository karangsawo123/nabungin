'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Transaction, TransactionType } from '@/types/database'

export interface CreateTransactionInput {
  workspaceId: string
  goalId: string
  categoryId: string
  type: TransactionType
  amount: number
  notes?: string | null
  transactionDate?: string | null
}

export type TransactionActionResult =
  | { success: true; transaction: Transaction }
  | { success: false; error: string }

export interface TransactionWithDetails extends Transaction {
  goals: { id: string; name: string; target_amount: number; current_amount: number } | null
  categories: { id: string; name: string; color: string | null; icon: string | null } | null
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

export interface TransactionFilters {
  goalId?: string
  categoryId?: string
  type?: TransactionType
  search?: string
}

/**
 * Mencatat transaksi baru (deposit atau withdrawal).
 * Mengimplementasikan anti-overdraft ganda (pre-check + database lock trigger).
 */
export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<TransactionActionResult> {
  const amount = Number(input.amount)
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Nominal transaksi harus lebih besar dari Rp0.' }
  }

  if (amount > 999999999999) {
    return { success: false, error: 'Nominal transaksi melebihi batas yang diizinkan.' }
  }

  if (!input.goalId) {
    return { success: false, error: 'Pilih target tabungan yang ingin dialokasikan.' }
  }

  if (!input.categoryId) {
    return { success: false, error: 'Pilih kategori pos alokasi transaksi.' }
  }

  const supabase = await createClient()

  // 1. Verifikasi pengguna autentikasi
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  // 2. Verifikasi keanggotaan workspace
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', input.workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return { success: false, error: 'Anda tidak memiliki akses ke ruang tabungan ini.' }
  }

  // 3. Verifikasi bahwa Goal dan Category berasal dari workspace yang sama
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id, group_id, name, current_amount, target_amount')
    .eq('id', input.goalId)
    .single()

  if (goalError || !goal || goal.group_id !== input.workspaceId) {
    return { success: false, error: 'Target tabungan tidak valid untuk workspace ini.' }
  }

  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id, group_id, name')
    .eq('id', input.categoryId)
    .single()

  if (catError || !category || category.group_id !== input.workspaceId) {
    return { success: false, error: 'Kategori pos tidak valid untuk workspace ini.' }
  }

  // 4. Pre-check anti-overdraft untuk penarikan (withdrawal)
  const currentBalance = Number(goal.current_amount) || 0
  if (input.type === 'withdrawal' && amount > currentBalance) {
    return {
      success: false,
      error: `Saldo tidak mencukupi untuk penarikan. Saldo saat ini hanya Rp ${new Intl.NumberFormat(
        'id-ID'
      ).format(currentBalance)}.`,
    }
  }

  // 5. Insert transaksi ke ledger
  const { data: newTx, error: txError } = await supabase
    .from('transactions')
    .insert({
      goal_id: input.goalId,
      category_id: input.categoryId,
      user_id: user.id,
      type: input.type,
      amount: amount,
      notes: input.notes?.trim() || null,
      transaction_date: input.transactionDate || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (txError) {
    return {
      success: false,
      error: txError.message || 'Gagal memproses transaksi.',
    }
  }

  // 6. Catat riwayat ke activity_logs
  await supabase.from('activity_logs').insert({
    group_id: input.workspaceId,
    user_id: user.id,
    action: input.type === 'deposit' ? 'deposit_created' : 'withdrawal_created',
    entity_type: 'transaction',
    entity_id: newTx.id,
    metadata: {
      goal_name: goal.name,
      category_name: category.name,
      amount: amount,
      type: input.type,
      notes: input.notes?.trim() || null,
    },
  })

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/goals')
  revalidatePath(`/goals/${input.goalId}`)

  return { success: true, transaction: newTx }
}

/**
 * Mengambil riwayat transaksi dengan detail Goal, Kategori, dan Profil pembuat
 */
export async function getTransactionsByWorkspace(
  workspaceId: string,
  filters?: TransactionFilters
): Promise<TransactionWithDetails[]> {
  const supabase = await createClient()

  // Ambil transaksi yang goals-nya milik workspace ini
  let query = supabase
    .from('transactions')
    .select(
      `
      *,
      goals!inner (id, name, target_amount, current_amount, group_id),
      categories (id, name, color, icon),
      profiles (id, full_name, avatar_url)
    `
    )
    .eq('goals.group_id', workspaceId)
    .order('created_at', { ascending: false })

  if (filters?.goalId) {
    query = query.eq('goal_id', filters.goalId)
  }

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  let result = data as unknown as TransactionWithDetails[]

  // Filter teks pencarian jika ada
  if (filters?.search?.trim()) {
    const s = filters.search.trim().toLowerCase()
    result = result.filter(
      (tx) =>
        tx.notes?.toLowerCase().includes(s) ||
        tx.goals?.name.toLowerCase().includes(s) ||
        tx.categories?.name.toLowerCase().includes(s)
    )
  }

  return result
}
