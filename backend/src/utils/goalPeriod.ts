export type GoalType = 'daily' | 'weekly'
export type GoalHistoryStatus = 'reached' | 'not_reached'

export function isGoalType(value: unknown): value is GoalType {
  return value === 'daily' || value === 'weekly'
}

export function getPeriodBounds(type: GoalType, reference = new Date()): {
  periodStart: string
  periodEnd: string
} {
  const ref = new Date(reference)

  if (type === 'daily') {
    const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0)
    const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999)
    return { periodStart: start.toISOString(), periodEnd: end.toISOString() }
  }

  const day = ref.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0)
  start.setDate(start.getDate() + diffToMonday)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { periodStart: start.toISOString(), periodEnd: end.toISOString() }
}

export function getPreviousPeriodBounds(type: GoalType, reference = new Date()): {
  periodStart: string
  periodEnd: string
} {
  const ref = new Date(reference)
  if (type === 'daily') {
    ref.setDate(ref.getDate() - 1)
  } else {
    ref.setDate(ref.getDate() - 7)
  }
  return getPeriodBounds(type, ref)
}

export function isPeriodExpired(type: GoalType, periodStart: string, reference = new Date()): boolean {
  const current = getPeriodBounds(type, reference)
  return new Date(periodStart).getTime() < new Date(current.periodStart).getTime()
}

export function calculateCompletion(completedTasks: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((completedTasks / target) * 100))
}

export function validateGoalTarget(target: unknown): number {
  const value = typeof target === 'number' ? target : Number(target)
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
    throw new Error('Il target deve essere un numero intero maggiore di zero')
  }
  return value
}

export function formatPeriodLabel(type: GoalType, periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }

  if (type === 'daily') {
    return start.toLocaleDateString('it-IT', opts)
  }

  return `${start.toLocaleDateString('it-IT', opts)} – ${end.toLocaleDateString('it-IT', opts)}`
}
