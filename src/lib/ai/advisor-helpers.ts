import type { Goal } from '@/types/database'

export interface ClosestGoalInfo {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  remainingAmount: number
  deadline: string | null
  remainingDays: number
  dailyRequired: number
  weeklyRequired: number
  monthlyRequired: number
  status: 'urgent' | 'moderate' | 'comfortable' | 'overdue' | 'no_deadline'
}

function todayZero(d: Date) {
  d.setHours(0, 0, 0, 0)
}

/**
 * Helper: Menghitung target tabungan dengan deadline terdekat dan rekomendasi setoran harian/mingguan
 */
export function calculateClosestGoal(goals: Goal[]): ClosestGoalInfo | null {
  const activeUnachievedGoals = goals.filter(
    (g) => Number(g.current_amount) < Number(g.target_amount)
  )

  if (activeUnachievedGoals.length === 0) return null

  const now = new Date()
  todayZero(now)

  // Prioritaskan yang memiliki deadline
  const withDeadlines = activeUnachievedGoals
    .filter((g) => Boolean(g.deadline))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

  const target = withDeadlines[0] || activeUnachievedGoals[0]
  const remaining = Math.max(0, Number(target.target_amount) - Number(target.current_amount))

  if (!target.deadline) {
    const defaultDays = 90
    return {
      id: target.id,
      name: target.name,
      targetAmount: Number(target.target_amount),
      currentAmount: Number(target.current_amount),
      remainingAmount: remaining,
      deadline: null,
      remainingDays: defaultDays,
      dailyRequired: Math.round(remaining / defaultDays),
      weeklyRequired: Math.round(remaining / (defaultDays / 7)),
      monthlyRequired: Math.round(remaining / (defaultDays / 30)),
      status: 'no_deadline',
    }
  }

  const deadlineDate = new Date(target.deadline)
  todayZero(deadlineDate)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let status: ClosestGoalInfo['status'] = 'comfortable'
  if (remainingDays < 0) {
    status = 'overdue'
  } else if (remainingDays <= 30) {
    status = 'urgent'
  } else if (remainingDays <= 90) {
    status = 'moderate'
  }

  const safeDays = Math.max(1, remainingDays)
  const dailyRequired = Math.round(remaining / safeDays)
  const weeklyRequired = Math.round(remaining / Math.max(1, safeDays / 7))
  const monthlyRequired = Math.round(remaining / Math.max(1, safeDays / 30))

  return {
    id: target.id,
    name: target.name,
    targetAmount: Number(target.target_amount),
    currentAmount: Number(target.current_amount),
    remainingAmount: remaining,
    deadline: target.deadline,
    remainingDays,
    dailyRequired,
    weeklyRequired,
    monthlyRequired,
    status,
  }
}
