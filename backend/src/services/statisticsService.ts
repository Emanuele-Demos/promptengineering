import type { Database } from 'sqlite'
import { getDatabase } from '../config/database'
import {
  formatAverageCompletionTime,
  getDateRange,
  getMonthLabel,
  getPreviousDateRange,
  getWeekdayLabel,
  type DateRange,
  type StatisticsFilter,
} from '../utils/statisticsPeriod'

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Bassa',
}

export interface StatisticsResponse {
  completedToday: number
  completedWeek: number
  completedMonth: number
  overdue: number
  open: number
  averageCompletionTime: string
  averageCompletionTimeMs: number
  filter: StatisticsFilter
  periodStart: string
  periodEnd: string
  previousPeriod?: {
    completed: number
    changePercent: number | null
  }
  weeklyTrend: Array<{ day: string; completed: number }>
  monthlyCompletions: Array<{ month: string; completed: number }>
  tasksByCategory: Array<{ category: string; count: number }>
  tasksByPriority: Array<{ priority: string; count: number }>
}

interface TaskStatRow {
  id: string
  status: string
  priority: string
  assigneeId: string | null
  categoryId: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  categoryName: string | null
}

async function getUserTasks(userId: string, db: Database): Promise<TaskStatRow[]> {
  return (await db.all(
    `SELECT t.id, t.status, t.priority, t.assigneeId, t.categoryId, t.dueDate,
            t.createdAt, t.updatedAt, c.name AS categoryName
     FROM tasks t
     LEFT JOIN categories c ON c.id = t.categoryId
     WHERE t.assigneeId = ?
       AND (t.archived = 0 OR t.archived IS NULL)`,
    [userId]
  )) as TaskStatRow[]
}

function isCompletedInRange(task: TaskStatRow, range: DateRange): boolean {
  if (task.status !== 'done') return false
  const updated = new Date(task.updatedAt).getTime()
  return updated >= range.start.getTime() && updated <= range.end.getTime()
}

function countCompletedInRange(tasks: TaskStatRow[], range: DateRange): number {
  return tasks.filter((t) => isCompletedInRange(t, range)).length
}

function isOverdue(task: TaskStatRow, todayStr: string): boolean {
  return (
    task.status !== 'done' &&
    !!task.dueDate &&
    task.dueDate < todayStr
  )
}

export async function getStatistics(
  userId: string,
  filter: StatisticsFilter = '7d',
  customFrom?: string,
  customTo?: string,
  db?: Database
): Promise<StatisticsResponse> {
  const connection = db ?? (await getDatabase())
  const tasks = await getUserTasks(userId, connection)
  const now = new Date()
  const range = getDateRange(filter, customFrom, customTo, now)

  const todayRange = getDateRange('today', undefined, undefined, now)
  const weekRange = getDateRange('7d', undefined, undefined, now)
  const monthRange = getDateRange('30d', undefined, undefined, now)

  const completedToday = countCompletedInRange(tasks, todayRange)
  const completedWeek = countCompletedInRange(tasks, weekRange)
  const completedMonth = countCompletedInRange(tasks, monthRange)
  const completedInFilter = countCompletedInRange(tasks, range)

  const todayStr = now.toISOString().slice(0, 10)
  const overdue = tasks.filter((t) => isOverdue(t, todayStr)).length
  const open = tasks.filter((t) => t.status !== 'done').length

  const completedTasks = tasks.filter((t) => t.status === 'done')
  let totalMs = 0
  for (const task of completedTasks) {
    const diff = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()
    totalMs += Math.max(0, diff)
  }
  const averageCompletionTime = formatAverageCompletionTime(totalMs, completedTasks.length)
  const averageCompletionTimeMs =
    completedTasks.length > 0 ? Math.round(totalMs / completedTasks.length) : 0

  const previousRange = getPreviousDateRange(range)
  const previousCompleted = countCompletedInRange(tasks, previousRange)
  const changePercent =
    previousCompleted > 0
      ? Math.round(((completedInFilter - previousCompleted) / previousCompleted) * 100)
      : completedInFilter > 0
        ? 100
        : null

  const weeklyTrend: StatisticsResponse['weeklyTrend'] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    const dayRange = { start: dayStart, end: dayEnd }
    weeklyTrend.push({
      day: getWeekdayLabel(d),
      completed: countCompletedInRange(tasks, dayRange),
    })
  }

  const monthlyCompletions: StatisticsResponse['monthlyCompletions'] = []
  const monthsToShow = filter === 'year' ? 12 : 6
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    monthlyCompletions.push({
      month: getMonthLabel(d),
      completed: countCompletedInRange(tasks, { start: monthStart, end: monthEnd }),
    })
  }

  const categoryMap = new Map<string, number>()
  for (const task of tasks) {
    const name = task.categoryName || 'Altro'
    categoryMap.set(name, (categoryMap.get(name) ?? 0) + 1)
  }
  const tasksByCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const priorityMap = new Map<string, number>()
  for (const task of tasks) {
    const label = PRIORITY_LABELS[task.priority] ?? task.priority
    priorityMap.set(label, (priorityMap.get(label) ?? 0) + 1)
  }
  const tasksByPriority = Array.from(priorityMap.entries())
    .map(([priority, count]) => ({ priority, count }))
    .sort((a, b) => b.count - a.count)

  return {
    completedToday,
    completedWeek,
    completedMonth,
    overdue,
    open,
    averageCompletionTime,
    averageCompletionTimeMs,
    filter,
    periodStart: range.start.toISOString(),
    periodEnd: range.end.toISOString(),
    previousPeriod: {
      completed: previousCompleted,
      changePercent,
    },
    weeklyTrend,
    monthlyCompletions,
    tasksByCategory,
    tasksByPriority,
  }
}
