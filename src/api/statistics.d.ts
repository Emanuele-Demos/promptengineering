export type StatisticsFilter = 'today' | '7d' | '30d' | 'year' | 'custom'

export interface StatisticsData {
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

export function getStatistics(options?: {
  filter?: StatisticsFilter
  from?: string
  to?: string
}): Promise<StatisticsData>
