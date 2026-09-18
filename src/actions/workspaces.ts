'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Group } from '@/types/database'

export type WorkspaceActionResult =
  | { success: true; group: Group; role: 'owner' }
  | { success: false; error: string }

export type DeleteWorkspaceResult =
  | { success: true; fallbackWorkspaceId: string }
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

  // 4. Inisialisasi kategori bawaan untuk Shared Workspace (Setoran & Penarikan)
  await supabase.from('categories').insert([
    // Kategori Setoran
    { group_id: groupId, name: 'Patungan Bersama', icon: 'wallet', color: '#10B981' },
    { group_id: groupId, name: 'Bonus & Hadiah', icon: 'gift', color: '#06B6D4' },
    { group_id: groupId, name: 'Sisa Belanja', icon: 'piggy-bank', color: '#F59E0B' },
    // Kategori Penarikan & Pengeluaran
    { group_id: groupId, name: 'Pencairan / Realisasi Target', icon: 'shopping-bag', color: '#10B981' },
    { group_id: groupId, name: 'Operasional', icon: 'tag', color: '#3B82F6' },
    { group_id: groupId, name: 'Biaya Medis / Darurat', icon: 'heart', color: '#F43F5E' },
    { group_id: groupId, name: 'Perbaikan / Servis', icon: 'car', color: '#8B5CF6' },
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

/**
 * Menghapus Shared Workspace secara permanen (Khusus Owner).
 * Seluruh mutasi transaksi, target, pos kategori, riwayat aktivitas, dan relasi anggota di dalamnya akan dihapus.
 * Ruang tabungan personal utama diproteksi dan tidak dapat dihapus.
 */
export async function deleteWorkspaceAction(
  groupId: string
): Promise<DeleteWorkspaceResult> {
  const supabase = await createClient()

  // 1. Verifikasi pengguna terotentikasi
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  // 2. Ambil informasi grup yang akan dihapus
  const { data: targetGroup, error: fetchGroupError } = await supabase
    .from('groups')
    .select('id, name, type')
    .eq('id', groupId)
    .maybeSingle()

  if (fetchGroupError || !targetGroup) {
    return { success: false, error: 'Ruang tabungan tidak ditemukan atau sudah dihapus.' }
  }

  // 3. Proteksi ruang tabungan personal utama
  if (targetGroup.type === 'personal') {
    return {
      success: false,
      error: 'Ruang tabungan pribadi (Personal) tidak dapat dihapus karena merupakan akun utama Anda.',
    }
  }

  // 4. Verifikasi bahwa pemanggil adalah owner dari grup ini
  const { data: callerMembership, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError || !callerMembership || callerMembership.role !== 'owner') {
    return {
      success: false,
      error: 'Hanya pemilik (owner) yang memiliki wewenang untuk menghapus ruang tabungan ini.',
    }
  }

  // 5. Tangani penghapusan transaksi terlebih dahulu
  // Menghindari pelanggaran foreign key ON DELETE RESTRICT dari transactions.category_id -> categories.id
  const { data: groupGoals } = await supabase
    .from('goals')
    .select('id')
    .eq('group_id', groupId)

  const goalIds = groupGoals?.map((g) => g.id) || []
  if (goalIds.length > 0) {
    const { error: txDeleteError } = await supabase
      .from('transactions')
      .delete()
      .in('goal_id', goalIds)

    if (txDeleteError) {
      console.error('Gagal menghapus transaksi workspace:', txDeleteError)
      return {
        success: false,
        error: 'Gagal membersihkan mutasi transaksi ruang tabungan: ' + txDeleteError.message,
      }
    }
  }

  // 6. Hapus record groups
  // Di Postgres, ON DELETE CASCADE akan otomatis menghapus:
  // - goals
  // - categories
  // - group_members
  // - group_invites
  // - activity_logs
  const { error: deleteGroupError } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (deleteGroupError) {
    console.error('Gagal menghapus groups:', deleteGroupError)
    return {
      success: false,
      error: deleteGroupError.message || 'Gagal menghapus ruang tabungan.',
    }
  }

  // 7. Ambil daftar workspace tersisa dari pengguna untuk menentukan fallback
  const { data: remainingMemberships } = await supabase
    .from('group_members')
    .select('group_id, groups (id, type)')
    .eq('user_id', user.id)

  const personalMembership = remainingMemberships?.find(
    (m) => m.groups?.type === 'personal'
  )
  const fallbackGroupId =
    personalMembership?.group_id || remainingMemberships?.[0]?.group_id || ''

  // 8. Sinkronkan cookie active_workspace_id
  const cookieStore = await cookies()
  if (fallbackGroupId) {
    cookieStore.set('active_workspace_id', fallbackGroupId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  } else {
    cookieStore.delete('active_workspace_id')
  }

  // 9. Revalidate semua cache terkait
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard')
  revalidatePath('/groups')
  revalidatePath('/goals')
  revalidatePath('/transactions')
  revalidatePath('/categories')

  return { success: true, fallbackWorkspaceId: fallbackGroupId }
}

