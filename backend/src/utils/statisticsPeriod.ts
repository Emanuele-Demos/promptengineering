export type StatisticsFilter = 'today' | '7d' | '30d' | 'year' | 'custom'

const DAY_MS = 24 * 60 * 60 * 1000

export function isStatisticsFilter(value: unknown): value is StatisticsFilter {
  return value === 'today' || value === '7d' || value === '30d' || value === 'year' || value === 'custom'
}

export interface DateRange {
  start: Date
  end: Date
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
  reference = new Date()
): DateRange {
  const now = reference
  const end = endOfDay(now)

  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end }
    case '7d': {
      const start = startOfDay(new Date(now.getTime() - 6 * DAY_MS))
      return { start, end }
    }
    case '30d': {
      const start = startOfDay(new Date(now.getTime() - 29 * DAY_MS))
      return { start, end }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      return { start, end }
    }
    case 'custom': {
      if (!customFrom || !customTo) {
        throw new Error('Intervallo personalizzato: specificare from e to')
      }
      const start = startOfDay(new Date(customFrom))
      const customEnd = endOfDay(new Date(customTo))
      if (Number.isNaN(start.getTime()) || Number.isNaN(customEnd.getTime())) {
        throw new Error('Date non valide per l\'intervallo personalizzato')
      }
      if (start > customEnd) {
        throw new Error('La data iniziale deve precedere la data finale')
      }
      return { start, end: customEnd }
    }
    default:
      return { start: startOfDay(new Date(now.getTime() - 6 * DAY_MS)), end }
  }
}

export function getPreviousDateRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime()
  const prevEnd = new Date(range.start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - duration)
  return { start: prevStart, end: prevEnd }
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

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export function getWeekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()]
}

export function getMonthLabel(date: Date): string {
  return MONTH_LABELS[date.getMonth()]
}

export { WEEKDAY_LABELS, MONTH_LABELS }
