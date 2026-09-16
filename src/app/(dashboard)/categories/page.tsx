import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CategoryList } from '@/components/categories/category-list'
import type { Category } from '@/types/database'

export const metadata = {
  title: 'Kategori Pos Tabungan — Nabungin',
  description: 'Kelola kategori pos alokasi tabungan untuk pelacakan transaksi terstruktur.',
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const savedWorkspaceId = cookieStore.get('active_workspace_id')?.value

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, role, groups (*)')
    .eq('user_id', user.id)

  const validMemberships = memberships || []

  let activeGroupId = ''
  const isSavedValid = validMemberships.some((m) => m.group_id === savedWorkspaceId)

  if (isSavedValid && savedWorkspaceId) {
    activeGroupId = savedWorkspaceId
  } else {
    const personal = validMemberships.find((m) => m.groups?.type === 'personal')
    activeGroupId = personal?.group_id || validMemberships[0]?.group_id || ''
  }

  let initialCategories: Category[] = []
  if (activeGroupId) {
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('group_id', activeGroupId)
      .order('name', { ascending: true })

    initialCategories = (catData || []) as Category[]
  }

  return (
    <div className="space-y-6">
      <CategoryList
        initialCategories={initialCategories}
        initialWorkspaceId={activeGroupId}
      />
    </div>
  )
}
