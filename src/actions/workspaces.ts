'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Group } from '@/types/database'

export type WorkspaceActionResult =
  | { success: true; group: Group; role: 'owner' }
  | { success: false; error: string }

/**
 * Membuat Shared Workspace baru.
 * Creator otomatis terdaftar sebagai owner di group_members sesuai RLS database.
 */
export async function createSharedWorkspaceAction(
  name: string
): Promise<WorkspaceActionResult> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return { success: false, error: 'Nama ruang tabungan wajib diisi.' }
  }

  if (trimmedName.length > 50) {
    return { success: false, error: 'Nama ruang tabungan maksimal 50 karakter.' }
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

  const groupId = crypto.randomUUID()

  // 2. Insert ke tabel groups dengan type = 'shared'
  // Catatan arsitektur: Jangan gunakan .select() langsung pada insert ini karena RLS SELECT pada tabel groups
  // memerlukan record di group_members (is_group_member), yang baru akan di-insert pada langkah berikutnya.
  const { error: groupError } = await supabase
    .from('groups')
    .insert({
      id: groupId,
      name: trimmedName,
      type: 'shared',
      created_by: user.id,
    })

  if (groupError) {
    return {
      success: false,
      error: groupError.message || 'Gagal membuat ruang tabungan baru.',
    }
  }

  // 3. Daftarkan creator sebagai owner di group_members (memenuhi RLS auth.uid() = user_id)
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    return {
      success: false,
      error: memberError.message || 'Gagal mendaftarkan hak akses owner.',
    }
  }

  // 4. Inisialisasi kategori bawaan untuk Shared Workspace
  await supabase.from('categories').insert([
    { group_id: groupId, name: 'Patungan Bersama', icon: 'wallet', color: '#10B981' },
    { group_id: groupId, name: 'Operasional', icon: 'tag', color: '#3B82F6' },
    { group_id: groupId, name: 'Dana Darurat Grup', icon: 'piggy-bank', color: '#F59E0B' },
  ])

  // 5. Query group data yang baru dibuat (sekarang SELECT lolos RLS karena user sudah terdaftar di group_members)
  const { data: newGroup, error: fetchError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (fetchError || !newGroup) {
    return {
      success: false,
      error: fetchError?.message || 'Gagal mengambil data ruang tabungan baru.',
    }
  }

  // 5. Simpan active workspace cookie
  const cookieStore = await cookies()
  cookieStore.set('active_workspace_id', newGroup.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  return { success: true, group: newGroup, role: 'owner' }
}

/**
 * Menyimpan ID workspace aktif ke cookie server setelah divalidasi terhadap database membership.
 */
export async function setActiveWorkspaceCookieAction(groupId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  // Validasi ketat: pastikan user benar-benar member dari group ini
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    // Jika tidak valid atau bukan member, jangan set cookie
    return
  }

  const cookieStore = await cookies()
  cookieStore.set('active_workspace_id', groupId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
