'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { GroupInvite, GroupMember } from '@/types/database'

export interface CreateInviteInput {
  workspaceId: string
  maxUses?: number
  expiresInDays?: number
}

export interface JoinWorkspaceInput {
  workspaceId: string
  token: string
}

export interface MemberWithProfile extends GroupMember {
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

export type CollaborationActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Membuat tautan undangan baru untuk Shared Workspace (Khusus Owner).
 */
export async function createGroupInviteAction(
  input: CreateInviteInput
): Promise<CollaborationActionResult<GroupInvite>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  // Verifikasi bahwa user adalah owner
  const { data: membership } = await supabase
    .from('group_members')
    .select('role, groups!inner (type, name)')
    .eq('group_id', input.workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'owner') {
    return { success: false, error: 'Hanya pemilik (owner) yang dapat membuat undangan.' }
  }

  if (membership.groups?.type === 'personal') {
    return { success: false, error: 'Personal workspace tidak dapat mengundang anggota.' }
  }

  const days = input.expiresInDays && input.expiresInDays > 0 ? input.expiresInDays : 7
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  const maxUses = input.maxUses && input.maxUses > 0 ? input.maxUses : 10

  const { data: newInvite, error: insertError } = await supabase
    .from('group_invites')
    .insert({
      group_id: input.workspaceId,
      created_by: user.id,
      max_uses: maxUses,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (insertError || !newInvite) {
    return { success: false, error: insertError?.message || 'Gagal membuat tautan undangan.' }
  }

  // Catat activity log
  await supabase.from('activity_logs').insert({
    group_id: input.workspaceId,
    user_id: user.id,
    action: 'invite_created',
    entity_type: 'group_invite',
    entity_id: newInvite.id,
    metadata: { max_uses: maxUses, expires_at: expiresAt },
  })

  revalidatePath('/groups')
  return { success: true, data: newInvite }
}

/**
 * Mengambil daftar undangan aktif untuk workspace tertentu.
 */
export async function getActiveInvitesAction(
  workspaceId: string
): Promise<GroupInvite[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('group_id', workspaceId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

/**
 * Membatalkan tautan undangan (Revoke).
 */
export async function revokeGroupInviteAction(
  inviteId: string,
  workspaceId: string
): Promise<CollaborationActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi berakhir. Silakan login kembali.' }
  }

  const { error } = await supabase
    .from('group_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId)
    .eq('group_id', workspaceId)

  if (error) {
    return { success: false, error: error.message || 'Gagal membatalkan undangan.' }
  }

  revalidatePath('/groups')
  return { success: true, data: null }
}

/**
 * Bergabung ke Shared Workspace menggunakan token undangan.
 * Melakukan validasi ketat terhadap masa berlaku, kuota, dan tipe workspace.
 */
export async function joinWorkspaceWithInviteAction(
  input: JoinWorkspaceInput
): Promise<CollaborationActionResult<{ groupId: string; groupName: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Silakan login terlebih dahulu untuk menerima undangan.' }
  }

  // 1. Cek apakah user sudah menjadi anggota
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', input.workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    const cookieStore = await cookies()
    cookieStore.set('active_workspace_id', input.workspaceId, { path: '/', maxAge: 31536000 })
    return {
      success: true,
      data: { groupId: input.workspaceId, groupName: 'Ruang Tabungan' },
    }
  }

  // 2. Gabung sementara ke group_members (diizinkan oleh policy auth.uid() = user_id)
  const { error: joinError } = await supabase.from('group_members').insert({
    group_id: input.workspaceId,
    user_id: user.id,
    role: 'member',
  })

  if (joinError) {
    return { success: false, error: 'Gagal bergabung ke ruang tabungan.' }
  }

  // 3. Setelah resmi terdaftar di group_members, verifikasi integritas token undangan
  const { data: invite, error: inviteError } = await supabase
    .from('group_invites')
    .select('*, groups!inner (name, type)')
    .eq('group_id', input.workspaceId)
    .eq('token', input.token)
    .maybeSingle()

  const isExpired = invite && new Date(invite.expires_at).getTime() < Date.now()
  const isRevoked = invite && invite.revoked_at !== null
  const isExceeded = invite && invite.used_count >= invite.max_uses
  const isPersonal = invite?.groups?.type === 'personal'

  if (inviteError || !invite || isExpired || isRevoked || isExceeded || isPersonal) {
    // Roll back otomatis: keluar dari membership karena token tidak sah
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', input.workspaceId)
      .eq('user_id', user.id)

    let errorReason = 'Tautan undangan tidak valid atau salah.'
    if (isExpired) errorReason = 'Tautan undangan telah kedaluwarsa.'
    if (isRevoked) errorReason = 'Tautan undangan telah dibatalkan oleh pemilik.'
    if (isExceeded) errorReason = 'Batas kuota penggunaan tautan undangan ini telah habis.'
    if (isPersonal) errorReason = 'Personal workspace tidak dapat menerima anggota.'

    return { success: false, error: errorReason }
  }

  // 4. Token sah: Naikkan used_count
  await supabase
    .from('group_invites')
    .update({ used_count: invite.used_count + 1 })
    .eq('id', invite.id)

  // 5. Catat ke activity_logs
  const groupName = invite.groups?.name || 'Ruang Bersama'
  await supabase.from('activity_logs').insert({
    group_id: input.workspaceId,
    user_id: user.id,
    action: 'member_joined',
    entity_type: 'group_member',
    entity_id: user.id,
    metadata: { group_name: groupName },
  })

  // 6. Kirim notifikasi ke seluruh owner workspace
  const { data: owners } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', input.workspaceId)
    .eq('role', 'owner')

  if (owners && owners.length > 0) {
    const notificationsToInsert = owners.map((o) => ({
      user_id: o.user_id,
      title: 'Anggota Baru Bergabung! 👋',
      message: `Seorang anggota baru telah bergabung ke ruang tabungan "${groupName}".`,
      type: 'member_joined',
      link: '/groups',
    }))
    await supabase.from('notifications').insert(notificationsToInsert)
  }

  // 7. Simpan cookie active workspace
  const cookieStore = await cookies()
  cookieStore.set('active_workspace_id', input.workspaceId, { path: '/', maxAge: 31536000 })

  revalidatePath('/groups')
  revalidatePath('/dashboard')

  return { success: true, data: { groupId: input.workspaceId, groupName } }
}

/**
 * Mengambil daftar anggota dalam workspace.
 */
export async function getWorkspaceMembersAction(
  workspaceId: string
): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('group_members')
    .select(
      `
      *,
      profiles (id, full_name, avatar_url)
    `
    )
    .eq('group_id', workspaceId)
    .order('joined_at', { ascending: true })

  if (error || !data) return []
  return data as unknown as MemberWithProfile[]
}

/**
 * Mengeluarkan anggota dari workspace (Khusus Owner).
 */
export async function removeMemberAction(
  workspaceId: string,
  targetUserId: string
): Promise<CollaborationActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sesi berakhir.' }

  if (user.id === targetUserId) {
    return { success: false, error: 'Owner tidak dapat mengeluarkan diri sendiri.' }
  }

  // Pastikan pelaku adalah owner
  const { data: caller } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!caller || caller.role !== 'owner') {
    return { success: false, error: 'Hanya pemilik yang dapat mengeluarkan anggota.' }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', workspaceId)
    .eq('user_id', targetUserId)

  if (error) {
    return { success: false, error: error.message || 'Gagal mengeluarkan anggota.' }
  }

  // Catat activity log
  await supabase.from('activity_logs').insert({
    group_id: workspaceId,
    user_id: user.id,
    action: 'member_removed',
    entity_type: 'group_member',
    entity_id: targetUserId,
    metadata: { removed_user_id: targetUserId },
  })

  revalidatePath('/groups')
  return { success: true, data: null }
}

/**
 * Anggota keluar secara mandiri dari Shared Workspace (Self Leave).
 */
export async function leaveWorkspaceAction(
  workspaceId: string
): Promise<CollaborationActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sesi berakhir.' }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return { success: false, error: 'Anda bukan anggota dari ruang ini.' }
  }

  if (member.role === 'owner') {
    return {
      success: false,
      error: 'Sebagai owner, Anda tidak dapat meninggalkan ruang tabungan bersama.',
    }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', workspaceId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message || 'Gagal meninggalkan workspace.' }
  }

  // Catat activity log
  await supabase.from('activity_logs').insert({
    group_id: workspaceId,
    user_id: user.id,
    action: 'member_left',
    entity_type: 'group_member',
    entity_id: user.id,
    metadata: { user_id: user.id },
  })

  revalidatePath('/groups')
  revalidatePath('/dashboard')

  return { success: true, data: null }
}
