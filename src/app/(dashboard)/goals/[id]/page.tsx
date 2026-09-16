import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoalDetailView } from '@/components/goals/goal-detail-view'
import type { Goal, Group, MemberRole } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: goal } = await supabase
    .from('goals')
    .select('name')
    .eq('id', id)
    .single()

  return {
    title: goal ? `${goal.name} — Target Tabungan Nabungin` : 'Detail Target Tabungan',
    description: 'Rincian target, akumulasi saldo, dan progress pencapaian tabungan.',
  }
}

export default async function GoalDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Verifikasi user autentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Query data goal (RLS akan membatasi baris sesuai membership)
  const { data: goalData, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (goalError || !goalData) {
    notFound()
  }

  const goal = goalData as Goal

  // 3. Verifikasi ganda: pastikan user adalah anggota dari workspace yang menaungi goal ini
  const { data: membershipData, error: memberError } = await supabase
    .from('group_members')
    .select('role, groups (*)')
    .eq('group_id', goal.group_id)
    .eq('user_id', user.id)
    .single()

  if (memberError || !membershipData || !membershipData.groups) {
    notFound()
  }

  const workspace = membershipData.groups as unknown as Group
  const userRole = membershipData.role as MemberRole

  return (
    <GoalDetailView
      initialGoal={goal}
      workspace={workspace}
      userRole={userRole}
    />
  )
}
