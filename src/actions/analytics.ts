'use server'

import { createClient } from '@/lib/supabase/server'

export interface MonthlyMetric {
  monthKey: string // YYYY-MM
  monthLabel: string // e.g., 'Okt 2026'
  deposit: number
  withdrawal: number
  net: number
}

export interface MemberContribution {
  userId: string
  name: string
  avatarUrl: string | null
  totalDeposit: number
  percentage: number
}

export interface CategoryAllocation {
  categoryId: string
  name: string
  color: string
  totalAmount: number
  percentage: number
}

export interface GoalProjection {
  goalId: string
  goalName: string
  targetAmount: number
  currentAmount: number
  remainingAmount: number
  percentProgress: number
  isAchieved: boolean
  deadline: string | null
  monthlyRequirement: number | null
  estimatedCompletionMonths: number | null
  estimatedCompletionDate: string | null
  hasSufficientData: boolean
  note?: string
}

export interface WorkspaceAnalyticsData {
  monthlyMetrics: MonthlyMetric[]
  contributions: MemberContribution[]
  categoryAllocations: CategoryAllocation[]
  projections: GoalProjection[]
  totalDepositAllTime: number
  totalWithdrawalAllTime: number
  netSavedAllTime: number
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

/**
 * Menghitung metrik analitik, kontribusi anggota, dan proyeksi target tabungan
 * terisolasi secara ketat berdasarkan active workspace.
 */
export async function getWorkspaceAnalyticsAction(
  workspaceId: string
): Promise<WorkspaceAnalyticsData> {
  const supabase = await createClient()

  // 1. Verifikasi keanggotaan workspace
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Sesi berakhir. Silakan login kembali.')
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    throw new Error('Anda tidak memiliki akses ke ruang tabungan ini.')
  }

  // 2. Ambil seluruh goals di workspace
  const { data: goalsData } = await supabase
    .from('goals')
    .select('id, name, target_amount, current_amount, status, deadline, created_at')
    .eq('group_id', workspaceId)
    .order('created_at', { ascending: true })

  const goals = goalsData || []

  // 3. Ambil seluruh transaksi di workspace
  // Lewat relasi goal_id -> goals(group_id)
  const goalIds = goals.map((g) => g.id)

  let transactions: Array<{
    id: string
    goal_id: string
    category_id: string
    user_id: string
    type: 'deposit' | 'withdrawal'
    amount: number
    transaction_date: string
    created_at: string
    profiles: { id: string; full_name: string; avatar_url: string | null } | null
    categories: { id: string; name: string; color: string | null } | null
  }> = []

  if (goalIds.length > 0) {
    const { data: txData } = await supabase
      .from('transactions')
      .select(
        `
        id,
        goal_id,
        category_id,
        user_id,
        type,
        amount,
        transaction_date,
        created_at,
        profiles (id, full_name, avatar_url),
        categories (id, name, color)
      `
      )
      .in('goal_id', goalIds)
      .order('transaction_date', { ascending: true })

    if (txData) {
      transactions = txData as unknown as typeof transactions
    }
  }

  // 4. Hitung Totals All-Time
  let totalDepositAllTime = 0
  let totalWithdrawalAllTime = 0

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0
    if (tx.type === 'deposit') {
      totalDepositAllTime += amt
    } else if (tx.type === 'withdrawal') {
      totalWithdrawalAllTime += amt
    }
  })

  const netSavedAllTime = Math.max(0, totalDepositAllTime - totalWithdrawalAllTime)

  // 5. Hitung 6 Bulan Terakhir (Monthly Metrics)
  const now = new Date()
  const monthlyMap = new Map<string, { deposit: number; withdrawal: number }>()

  // Buat slot 6 bulan terakhir mundur secara berurutan
  const last6MonthsKeys: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    last6MonthsKeys.push(key)
    monthlyMap.set(key, { deposit: 0, withdrawal: 0 })
  }

  transactions.forEach((tx) => {
    const dateStr = tx.transaction_date || tx.created_at
    const key = dateStr.slice(0, 7) // YYYY-MM
    if (monthlyMap.has(key)) {
      const current = monthlyMap.get(key)!
      const amt = Number(tx.amount) || 0
      if (tx.type === 'deposit') {
        current.deposit += amt
      } else {
        current.withdrawal += amt
      }
    }
  })

  const monthlyMetrics: MonthlyMetric[] = last6MonthsKeys.map((key) => {
    const [y, m] = key.split('-')
    const monthIndex = parseInt(m, 10) - 1
    const data = monthlyMap.get(key) || { deposit: 0, withdrawal: 0 }
    return {
      monthKey: key,
      monthLabel: `${MONTH_NAMES[monthIndex]} ${y.slice(2)}`,
      deposit: data.deposit,
      withdrawal: data.withdrawal,
      net: data.deposit - data.withdrawal,
    }
  })

  // 6. Hitung Kontribusi Anggota (Deposits per Member)
  const memberDepositMap = new Map<
    string,
    { name: string; avatarUrl: string | null; total: number }
  >()

  transactions.forEach((tx) => {
    if (tx.type === 'deposit') {
      const uId = tx.user_id
      const name = tx.profiles?.full_name || 'Anggota'
      const avatarUrl = tx.profiles?.avatar_url || null
      const amt = Number(tx.amount) || 0

      const existing = memberDepositMap.get(uId) || { name, avatarUrl, total: 0 }
      existing.total += amt
      memberDepositMap.set(uId, existing)
    }
  })

  const contributions: MemberContribution[] = Array.from(memberDepositMap.entries()).map(
    ([userId, data]) => ({
      userId,
      name: data.name,
      avatarUrl: data.avatarUrl,
      totalDeposit: data.total,
      percentage:
        totalDepositAllTime > 0 ? Math.round((data.total / totalDepositAllTime) * 100) : 0,
    })
  )

  // 7. Hitung Alokasi Kategori (Deposits per Category)
  const categoryMap = new Map<string, { name: string; color: string; total: number }>()

  transactions.forEach((tx) => {
    if (tx.type === 'deposit' && tx.categories) {
      const catId = tx.category_id
      const name = tx.categories.name
      const color = tx.categories.color || '#10B981'
      const amt = Number(tx.amount) || 0

      const existing = categoryMap.get(catId) || { name, color, total: 0 }
      existing.total += amt
      categoryMap.set(catId, existing)
    }
  })

  const categoryAllocations: CategoryAllocation[] = Array.from(categoryMap.entries()).map(
    ([categoryId, data]) => ({
      categoryId,
      name: data.name,
      color: data.color,
      totalAmount: data.total,
      percentage:
        totalDepositAllTime > 0 ? Math.round((data.total / totalDepositAllTime) * 100) : 0,
    })
  )

  // 8. Hitung Kecepatan Menabung Bulanan untuk Proyeksi (Saving Velocity)
  // Berdasarkan rata-rata deposit bulanan dari transaksi riil yang ada
  const depositTransactions = transactions.filter((t) => t.type === 'deposit')
  const hasSufficientVelocityData = depositTransactions.length >= 2

  let averageMonthlyDeposit = 0
  if (hasSufficientVelocityData) {
    // Total deposit dibagi jumlah bulan unik bertransaksi (minimal 1)
    const activeMonthKeys = new Set(
      depositTransactions.map((t) => (t.transaction_date || t.created_at).slice(0, 7))
    )
    const monthCount = Math.max(1, activeMonthKeys.size)
    averageMonthlyDeposit = totalDepositAllTime / monthCount
  }

  // 9. Hitung Proyeksi Setiap Goal
  const projections: GoalProjection[] = goals.map((goal) => {
    const targetAmt = Number(goal.target_amount) || 0
    const currentAmt = Number(goal.current_amount) || 0
    const remainingAmt = Math.max(0, targetAmt - currentAmt)
    const isAchieved = targetAmt > 0 && currentAmt >= targetAmt
    const percentProgress =
      targetAmt > 0 ? Math.min(100, Math.round((currentAmt / targetAmt) * 100)) : 0

    // Hitung Monthly Requirement berdasarkan deadline
    let monthlyRequirement: number | null = null
    if (!isAchieved && goal.deadline) {
      const deadlineDate = new Date(goal.deadline)
      const diffMs = deadlineDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays > 0) {
        const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30))
        monthlyRequirement = Math.ceil(remainingAmt / monthsRemaining)
      } else {
        // Deadline sudah lewat atau hari ini
        monthlyRequirement = remainingAmt
      }
    }

    // Hitung Estimated Completion Date berdasarkan average monthly deposit
    let estimatedCompletionMonths: number | null = null
    let estimatedCompletionDate: string | null = null

    if (isAchieved) {
      estimatedCompletionMonths = 0
    } else if (hasSufficientVelocityData && averageMonthlyDeposit > 0) {
      // Proporsi tabungan rata-rata yang dialokasikan ke goal ini
      const estimatedMonths = Math.ceil(remainingAmt / averageMonthlyDeposit)
      estimatedCompletionMonths = Math.max(1, estimatedMonths)

      const estDate = new Date(now.getFullYear(), now.getMonth() + estimatedCompletionMonths, 1)
      estimatedCompletionDate = `${MONTH_NAMES[estDate.getMonth()]} ${estDate.getFullYear()}`
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: targetAmt,
      currentAmount: currentAmt,
      remainingAmount: remainingAmt,
      percentProgress,
      isAchieved,
      deadline: goal.deadline,
      monthlyRequirement,
      estimatedCompletionMonths,
      estimatedCompletionDate,
      hasSufficientData: hasSufficientVelocityData,
    }
  })

  return {
    monthlyMetrics,
    contributions,
    categoryAllocations,
    projections,
    totalDepositAllTime,
    totalWithdrawalAllTime,
    netSavedAllTime,
  }
}
