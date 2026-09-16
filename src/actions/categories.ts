'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/database'

export type CategoryActionResult<T = Category> =
  | { success: true; category: T }
  | { success: false; error: string }

export interface CreateCategoryInput {
  workspaceId: string
  name: string
  icon?: string
  color?: string
}

export interface UpdateCategoryInput {
  categoryId: string
  workspaceId: string
  name: string
  icon?: string
  color?: string
}

/**
 * Mengambil daftar kategori pos tabungan untuk workspace tertentu (terproteksi RLS)
 */
export async function getCategoriesByWorkspace(
  workspaceId: string
): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('group_id', workspaceId)
    .order('name', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
}

/**
 * Membuat kategori baru di dalam active workspace.
 */
export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<CategoryActionResult> {
  const trimmedName = input.name?.trim()

  if (!trimmedName) {
    return { success: false, error: 'Nama kategori pos wajib diisi.' }
  }

  if (trimmedName.length > 50) {
    return { success: false, error: 'Nama kategori maksimal 50 karakter.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  // Verifikasi keanggotaan workspace
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

  const { data: newCategory, error: insertError } = await supabase
    .from('categories')
    .insert({
      group_id: input.workspaceId,
      name: trimmedName,
      icon: input.icon || 'tag',
      color: input.color || '#3B82F6',
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return {
        success: false,
        error: 'Kategori dengan nama ini sudah ada di ruang tabungan ini.',
      }
    }
    return {
      success: false,
      error: insertError.message || 'Gagal menambahkan kategori pos.',
    }
  }

  revalidatePath('/categories')
  return { success: true, category: newCategory }
}

/**
 * Memperbarui kategori pos tabungan (khusus owner sesuai RLS).
 */
export async function updateCategoryAction(
  input: UpdateCategoryInput
): Promise<CategoryActionResult> {
  const trimmedName = input.name?.trim()

  if (!trimmedName) {
    return { success: false, error: 'Nama kategori pos wajib diisi.' }
  }

  if (trimmedName.length > 50) {
    return { success: false, error: 'Nama kategori maksimal 50 karakter.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  const { data: updatedCategory, error: updateError } = await supabase
    .from('categories')
    .update({
      name: trimmedName,
      icon: input.icon || 'tag',
      color: input.color || '#3B82F6',
    })
    .eq('id', input.categoryId)
    .eq('group_id', input.workspaceId)
    .select()
    .single()

  if (updateError) {
    if (updateError.code === '23505') {
      return {
        success: false,
        error: 'Nama kategori sudah digunakan oleh kategori lain di workspace ini.',
      }
    }
    return {
      success: false,
      error: updateError.message || 'Gagal memperbarui kategori pos.',
    }
  }

  revalidatePath('/categories')
  return { success: true, category: updatedCategory }
}
