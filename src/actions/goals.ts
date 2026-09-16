'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Goal } from '@/types/database'

export type GoalActionResult<T = Goal> =
  | { success: true; goal: T }
  | { success: false; error: string }

export interface CreateGoalInput {
  workspaceId: string
  name: string
  targetAmount: number
  description?: string | null
  deadline?: string | null
}

export interface UpdateGoalInput {
  goalId: string
  workspaceId: string
  name: string
  targetAmount: number
  description?: string | null
  deadline?: string | null
}

/**
 * Membuat Target Tabungan (Goal) baru di dalam active workspace.
 * Memvalidasi kepemilikan workspace melalui group_members dan mematuhi RLS.
 */
export async function createGoalAction(
  input: CreateGoalInput
): Promise<GoalActionResult> {
  const trimmedName = input.name?.trim()

  if (!trimmedName) {
    return { success: false, error: 'Nama target tabungan wajib diisi.' }
  }

  if (trimmedName.length > 100) {
    return { success: false, error: 'Nama target maksimal 100 karakter.' }
  }

  const targetAmount = Number(input.targetAmount)
  if (isNaN(targetAmount) || targetAmount <= 0) {
    return { success: false, error: 'Target nominal harus berupa angka lebih besar dari 0.' }
  }

  if (targetAmount > 999999999999.99) {
    return { success: false, error: 'Target nominal melebihi batas maksimum transaksi.' }
  }

  const supabase = await createClient()

  // 1. Verifikasi pengguna terotentikasi
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  // 2. Verifikasi user adalah anggota dari workspace yang dituju
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', input.workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return {
      success: false,
      error: 'Anda tidak memiliki akses ke ruang tabungan ini.',
    }
  }

  // 3. Insert record goal baru
  const { data: newGoal, error: insertError } = await supabase
    .from('goals')
    .insert({
      group_id: input.workspaceId,
      name: trimmedName,
      target_amount: targetAmount,
      current_amount: 0.00,
      description: input.description?.trim() || null,
      deadline: input.deadline || null,
      status: 'active',
      created_by: user.id,
    })
    .select()
    .single()

  if (insertError || !newGoal) {
    return {
      success: false,
      error: insertError?.message || 'Gagal membuat target tabungan baru.',
    }
  }

  revalidatePath('/goals')
  revalidatePath('/dashboard')

  return { success: true, goal: newGoal }
}

/**
 * Memperbarui nama atau target nominal Goal.
 * Keamanan: Dilarang menyentuh current_amount, status, atau achieved_at dari frontend.
 */
export async function updateGoalAction(
  input: UpdateGoalInput
): Promise<GoalActionResult> {
  const trimmedName = input.name?.trim()

  if (!trimmedName) {
    return { success: false, error: 'Nama target tabungan wajib diisi.' }
  }

  if (trimmedName.length > 100) {
    return { success: false, error: 'Nama target maksimal 100 karakter.' }
  }

  const targetAmount = Number(input.targetAmount)
  if (isNaN(targetAmount) || targetAmount <= 0) {
    return { success: false, error: 'Target nominal harus berupa angka lebih besar dari 0.' }
  }

  const supabase = await createClient()

  // 1. Verifikasi user autentikasi
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  // 2. Verifikasi akses membership pada workspace goal
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', input.workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return {
      success: false,
      error: 'Anda tidak memiliki izin untuk mengedit target di workspace ini.',
    }
  }

  // 3. Update data goal (hanya name, target_amount, description, deadline)
  const { data: updatedGoal, error: updateError } = await supabase
    .from('goals')
    .update({
      name: trimmedName,
      target_amount: targetAmount,
      description: input.description?.trim() || null,
      deadline: input.deadline || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.goalId)
    .eq('group_id', input.workspaceId)
    .select()
    .single()

  if (updateError || !updatedGoal) {
    return {
      success: false,
      error: updateError?.message || 'Gagal memperbarui target tabungan.',
    }
  }

  revalidatePath('/goals')
  revalidatePath(`/goals/${input.goalId}`)
  revalidatePath('/dashboard')

  return { success: true, goal: updatedGoal }
}

/**
 * Mengambil daftar Goals untuk workspace tertentu (terproteksi RLS)
 */
export async function getGoalsByWorkspace(workspaceId: string): Promise<Goal[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('group_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Mengambil satu Goal berdasarkan ID (terproteksi RLS)
 */
export async function getGoalById(goalId: string): Promise<Goal | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

