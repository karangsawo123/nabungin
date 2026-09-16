import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/transactions/transaction-list'
import {
  getTransactionsByWorkspace,
  type TransactionWithDetails,
} from '@/actions/transactions'

export const metadata = {
  title: 'Riwayat Transaksi — Nabungin',
  description: 'Catat dan tinjau seluruh mutasi setoran dan penarikan dana tabungan.',
}

export default async function TransactionsPage() {
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

  let initialTransactions: TransactionWithDetails[] = []
  if (activeGroupId) {
    initialTransactions = await getTransactionsByWorkspace(activeGroupId)
  }

  return (
    <div className="space-y-6">
      <TransactionList
        initialTransactions={initialTransactions}
        initialWorkspaceId={activeGroupId}
      />
    </div>
  )
}
