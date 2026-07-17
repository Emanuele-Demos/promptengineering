import type { Task, TaskPriority, StatisticsFilter } from '../types'
import { PRIORITY_LABELS } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export interface DateRange {
  start: Date
  end: Date
}

export interface TeamChartData {
  completionTrend: Array<{ name: string; task: number }>
  completionBuckets: Array<{ name: string; task: number }>
  tasksByCategory: Array<{ name: string; value: number }>
  tasksByPriority: Array<{ name: string; value: number }>
  trendTitle: string
  bucketsTitle: string
}

export interface TeamPeriodStats {
  completedLabel: string
  createdLabel: string
  averageTimeLabel: string
  completedInPeriod: number
  changePercent: number | null
  createdInPeriod: number
  averageCompletionTimeInPeriod: string
  range: DateRange
  customRangeIncomplete: boolean
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function getDateRange(
  filter: StatisticsFilter,
  customFrom?: string,
  customTo?: string,
  reference = new Date(),
): DateRange {
  const end = endOfDay(reference)

  switch (filter) {
    case 'today':
      return { start: startOfDay(reference), end }
    case '7d': {
      const start = startOfDay(new Date(reference.getTime() - 6 * DAY_MS))
      return { start, end }
    }
    case '30d': {
      const start = startOfDay(new Date(reference.getTime() - 29 * DAY_MS))
      return { start, end }
    }
    case 'year': {
      const start = new Date(reference.getFullYear(), 0, 1, 0, 0, 0, 0)
      return { start, end }
    }
    case 'custom': {
      if (!customFrom || !customTo) {
        return getDateRange('7d', undefined, undefined, reference)
      }
      const start = startOfDay(new Date(customFrom))
      const customEnd = endOfDay(new Date(customTo))
      if (Number.isNaN(start.getTime()) || Number.isNaN(customEnd.getTime()) || start > customEnd) {
        return getDateRange('7d', undefined, undefined, reference)
      }
      return { start, end: customEnd }
    }
    default:
      return getDateRange('7d', undefined, undefined, reference)
  }
}

export function getPreviousDateRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime()
  const prevEnd = new Date(range.start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - duration)
  return { start: prevStart, end: prevEnd }
}

export function isCompletedInRange(task: Task, start: Date, end: Date): boolean {
  if (task.status !== 'done') return false
  const updated = new Date(task.updatedAt).getTime()
  return updated >= start.getTime() && updated <= end.getTime()
}

export function countCompletedInRange(tasks: Task[], start: Date, end: Date): number {
  return tasks.filter((task) => isCompletedInRange(task, start, end)).length
}

export function isTaskActiveInPeriod(task: Task, range: DateRange): boolean {
  const start = range.start.getTime()
  const end = range.end.getTime()
  const created = new Date(task.createdAt).getTime()
  const updated = new Date(task.updatedAt).getTime()
  return (created >= start && created <= end) || (updated >= start && updated <= end)
}

export function formatAverageCompletionTime(totalMs: number, count: number): string {
  if (count === 0) return '—'
  const avgMs = totalMs / count
  const hours = Math.floor(avgMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  if (days > 0) {
    return remHours > 0 ? `${days} giorni ${remHours} ore` : `${days} giorni`
  }
  if (hours > 0) return `${hours} ore`
  const minutes = Math.max(1, Math.round(avgMs / (1000 * 60)))
  return `${minutes} min`
}

export function getTeamPeriodRanges(reference = new Date()) {
  const end = endOfDay(reference)
  const todayStart = startOfDay(reference)
  const weekStart = startOfDay(new Date(reference.getTime() - 6 * DAY_MS))
  const monthStart = startOfDay(new Date(reference.getTime() - 29 * DAY_MS))
  return { todayStart, weekStart, monthStart, end }
}

export function computeAverageCompletionMs(tasks: Task[]): number {
  const completed = tasks.filter((task) => task.status === 'done')
  if (completed.length === 0) return 0

  let totalMs = 0
  for (const task of completed) {
    totalMs += Math.max(
      0,
      new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime(),
    )
  }
  return totalMs
}

function formatDayLabel(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}/${month}`
}

function countDaysInRange(range: DateRange): number {
  return Math.floor((startOfDay(range.end).getTime() - startOfDay(range.start).getTime()) / DAY_MS) + 1
}

function buildDailyBuckets(tasks: Task[], range: DateRange): TeamChartData['completionTrend'] {
  const buckets: TeamChartData['completionTrend'] = []
  const totalDays = countDaysInRange(range)

  for (let i = 0; i < totalDays; i++) {
    const day = new Date(range.start)
    day.setDate(day.getDate() + i)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    buckets.push({
      name: totalDays <= 7 ? WEEKDAY_LABELS[day.getDay()] : formatDayLabel(day),
      task: countCompletedInRange(tasks, dayStart, dayEnd),
    })
  }

  return buckets
}

function buildWeeklyBuckets(tasks: Task[], range: DateRange): TeamChartData['completionBuckets'] {
  const buckets: TeamChartData['completionBuckets'] = []
  let cursor = startOfDay(range.start)

  while (cursor.getTime() <= range.end.getTime()) {
    const weekEnd = endOfDay(new Date(cursor.getTime() + 6 * DAY_MS))
    const bucketEnd = weekEnd.getTime() > range.end.getTime() ? range.end : weekEnd
    buckets.push({
      name: `${formatDayLabel(cursor)}–${formatDayLabel(new Date(bucketEnd))}`,
      task: countCompletedInRange(tasks, cursor, bucketEnd),
    })
    cursor = startOfDay(new Date(cursor.getTime() + 7 * DAY_MS))
  }

  return buckets
}

function buildMonthlyBuckets(tasks: Task[], range: DateRange): TeamChartData['completionBuckets'] {
  const buckets: TeamChartData['completionBuckets'] = []
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)

  while (cursor.getTime() <= range.end.getTime()) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0)
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999)
    const bucketStart = monthStart.getTime() < range.start.getTime() ? range.start : monthStart
    const bucketEnd = monthEnd.getTime() > range.end.getTime() ? range.end : monthEnd
    buckets.push({
      name: MONTH_LABELS[cursor.getMonth()],
      task: countCompletedInRange(tasks, bucketStart, bucketEnd),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return buckets
}

function getPeriodLabels(filter: StatisticsFilter): {
  completed: string
  created: string
  averageTime: string
} {
  switch (filter) {
    case 'today':
      return {
        completed: 'Completati oggi (team)',
        created: 'Nuovi task oggi (team)',
        averageTime: 'Tempo medio oggi (team)',
      }
    case '7d':
      return {
        completed: 'Completati (7 giorni, team)',
        created: 'Nuovi task (7 giorni, team)',
        averageTime: 'Tempo medio (7 giorni, team)',
      }
    case '30d':
      return {
        completed: 'Completati (30 giorni, team)',
        created: 'Nuovi task (30 giorni, team)',
        averageTime: 'Tempo medio (30 giorni, team)',
      }
    case 'year':
      return {
        completed: 'Completati (anno, team)',
        created: 'Nuovi task (anno, team)',
        averageTime: 'Tempo medio (anno, team)',
      }
    case 'custom':
      return {
        completed: 'Completati (periodo, team)',
        created: 'Nuovi task (periodo, team)',
        averageTime: 'Tempo medio (periodo, team)',
      }
    default:
      return {
        completed: 'Completati nel periodo (team)',
        created: 'Nuovi task nel periodo (team)',
        averageTime: 'Tempo medio nel periodo (team)',
      }
  }
}

export function computeTeamPeriodStats(
  tasks: Task[],
  filter: StatisticsFilter = '7d',
  customFrom?: string,
  customTo?: string,
  reference = new Date(),
): TeamPeriodStats {
  const customRangeIncomplete = filter === 'custom' && (!customFrom || !customTo)
  const range = getDateRange(filter, customFrom, customTo, reference)
  const previousRange = getPreviousDateRange(range)
  const completedInPeriod = countCompletedInRange(tasks, range.start, range.end)
  const previousPeriodCompleted = countCompletedInRange(tasks, previousRange.start, previousRange.end)
  const changePercent =
    previousPeriodCompleted > 0
      ? Math.round(((completedInPeriod - previousPeriodCompleted) / previousPeriodCompleted) * 100)
      : completedInPeriod > 0
        ? 100
        : null

  const createdInPeriod = tasks.filter((task) => {
    const created = new Date(task.createdAt).getTime()
    return created >= range.start.getTime() && created <= range.end.getTime()
  }).length

  const completedTasksInPeriod = tasks.filter((task) =>
    isCompletedInRange(task, range.start, range.end),
  )
  const labels = getPeriodLabels(filter)

  return {
    completedLabel: labels.completed,
    createdLabel: labels.created,
    averageTimeLabel: labels.averageTime,
    completedInPeriod,
    changePercent,
    createdInPeriod,
    averageCompletionTimeInPeriod: formatAverageCompletionTime(
      computeAverageCompletionMs(completedTasksInPeriod),
      completedTasksInPeriod.length,
    ),
    range,
    customRangeIncomplete,
  }
}

export function computeTeamCharts(
  tasks: Task[],
  getCategoryName: (categoryId: string | null | undefined) => string,
  filter: StatisticsFilter = '7d',
  customFrom?: string,
  customTo?: string,
  reference = new Date(),
): TeamChartData {
  const range = getDateRange(filter, customFrom, customTo, reference)
  const periodTasks = tasks.filter((task) => isTaskActiveInPeriod(task, range))
  const daysInRange = countDaysInRange(range)

  let completionTrend: TeamChartData['completionTrend']
  let completionBuckets: TeamChartData['completionBuckets']
  let trendTitle: string
  let bucketsTitle: string

  if (filter === 'year') {
    completionTrend = buildMonthlyBuckets(tasks, range)
    completionBuckets = completionTrend
    trendTitle = 'Andamento mensile (anno in corso)'
    bucketsTitle = 'Completamenti mensili (anno in corso)'
  } else if (filter === 'today') {
    completionTrend = buildDailyBuckets(tasks, range)
    completionBuckets = completionTrend
    trendTitle = 'Completamenti di oggi'
    bucketsTitle = 'Completamenti di oggi'
  } else if (filter === 'custom' && daysInRange > 60) {
    completionTrend = buildMonthlyBuckets(tasks, range)
    completionBuckets = completionTrend
    trendTitle = 'Andamento mensile (periodo selezionato)'
    bucketsTitle = trendTitle
  } else if (filter === '30d' || (filter === 'custom' && daysInRange > 14)) {
    completionTrend = buildDailyBuckets(tasks, range)
    completionBuckets = daysInRange > 14 ? buildWeeklyBuckets(tasks, range) : completionTrend
    trendTitle =
      filter === 'custom'
        ? 'Andamento giornaliero (periodo selezionato)'
        : 'Andamento giornaliero (30 giorni)'
    bucketsTitle =
      daysInRange > 14
        ? filter === 'custom'
          ? 'Completamenti settimanali (periodo selezionato)'
          : 'Completamenti settimanali (30 giorni)'
        : trendTitle
  } else {
    completionTrend = buildDailyBuckets(tasks, range)
    completionBuckets = completionTrend
    trendTitle =
      filter === 'custom'
        ? 'Andamento giornaliero (periodo selezionato)'
        : 'Andamento giornaliero (7 giorni)'
    bucketsTitle = trendTitle
  }

  const categoryMap = new Map<string, number>()
  for (const task of periodTasks) {
    const name = getCategoryName(task.categoryId)
    categoryMap.set(name, (categoryMap.get(name) ?? 0) + 1)
  }
  const tasksByCategory = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const priorityMap = new Map<string, number>()
  for (const task of periodTasks) {
    const label = PRIORITY_LABELS[task.priority as TaskPriority] ?? task.priority
    priorityMap.set(label, (priorityMap.get(label) ?? 0) + 1)
  }
  const tasksByPriority = Array.from(priorityMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return {
    completionTrend,
    completionBuckets,
    tasksByCategory,
    tasksByPriority,
    trendTitle,
    bucketsTitle,
  }
}
