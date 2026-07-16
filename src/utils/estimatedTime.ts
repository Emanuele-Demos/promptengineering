export const WORK_DAY_MINUTES = 480
export const WORK_WEEK_MINUTES = 2400
export const MAX_ESTIMATED_MINUTES = 10_000

export type EstimatedTimeUnit = 'minutes' | 'hours' | 'days' | 'weeks'

export const ESTIMATED_TIME_UNIT_LABELS: Record<EstimatedTimeUnit, string> = {
  minutes: 'Minuti',
  hours: 'Ore',
  days: 'Giorni',
  weeks: 'Settimane',
}

export const ESTIMATED_TIME_PRESETS: Array<{
  label: string
  value: number
  unit: EstimatedTimeUnit
}> = [
  { label: '30 min', value: 30, unit: 'minutes' },
  { label: '1 ora', value: 1, unit: 'hours' },
  { label: '2 ore', value: 2, unit: 'hours' },
  { label: '1 giorno', value: 1, unit: 'days' },
  { label: '1 settimana', value: 1, unit: 'weeks' },
]

export function toEstimatedMinutes(value: number, unit: EstimatedTimeUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0

  switch (unit) {
    case 'minutes':
      return Math.round(value)
    case 'hours':
      return Math.round(value * 60)
    case 'days':
      return Math.round(value * WORK_DAY_MINUTES)
    case 'weeks':
      return Math.round(value * WORK_WEEK_MINUTES)
    default:
      return 0
  }
}

export function decomposeEstimatedMinutes(minutes: number): {
  value: number
  unit: EstimatedTimeUnit
} {
  if (minutes >= WORK_WEEK_MINUTES && minutes % WORK_WEEK_MINUTES === 0) {
    return { value: minutes / WORK_WEEK_MINUTES, unit: 'weeks' }
  }
  if (minutes >= WORK_DAY_MINUTES && minutes % WORK_DAY_MINUTES === 0) {
    return { value: minutes / WORK_DAY_MINUTES, unit: 'days' }
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: 'hours' }
  }
  return { value: minutes, unit: 'minutes' }
}

export function minutesToFormFields(minutes: number | null | undefined): {
  value: string
  unit: EstimatedTimeUnit
} {
  if (!minutes || minutes <= 0) {
    return { value: '', unit: 'hours' }
  }
  const { value, unit } = decomposeEstimatedMinutes(minutes)
  return { value: String(value), unit }
}

export function validateEstimatedTimeForm(
  value: string,
  unit: EstimatedTimeUnit,
): string | null {
  if (!value.trim()) return null

  const n = parseFloat(value.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) {
    return 'Inserisci un valore numerico maggiore di zero'
  }

  const minutes = toEstimatedMinutes(n, unit)
  if (minutes <= 0) {
    return 'Il tempo stimato deve essere maggiore di zero'
  }
  if (minutes > MAX_ESTIMATED_MINUTES) {
    return `Il tempo massimo è ${MAX_ESTIMATED_MINUTES} minuti`
  }

  return null
}

export function parseEstimatedTimeForm(
  value: string,
  unit: EstimatedTimeUnit,
): number | null {
  if (!value.trim()) return null
  const error = validateEstimatedTimeForm(value, unit)
  if (error) return null
  const n = parseFloat(value.replace(',', '.'))
  return toEstimatedMinutes(n, unit)
}

export function formatEstimatedTimeLong(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 minuti'

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'ora' : 'ore'}`)
  }
  if (mins > 0) {
    parts.push(`${mins} minut${mins === 1 ? 'o' : 'i'}`)
  }

  return parts.join(' ')
}

export function formatEstimatedTimeShort(minutes: number): string {
  const { value, unit } = decomposeEstimatedMinutes(minutes)

  if (unit === 'minutes') {
    return `${value} min`
  }
  if (unit === 'hours') {
    return value === 1 ? '1 ora' : `${value} ore`
  }
  if (unit === 'days') {
    return value === 1 ? '1 giorno' : `${value} giorni`
  }
  return value === 1 ? '1 settimana' : `${value} settimane`
}

/** Confronto futuro stimato vs reale (timer). */
export function compareEstimatedVsActual(
  estimatedMinutes: number | null | undefined,
  actualMinutes: number | null | undefined,
): {
  estimatedMinutes: number
  actualMinutes: number
  differenceMinutes: number
  percentDeviation: number | null
} | null {
  if (estimatedMinutes == null || actualMinutes == null) return null
  const differenceMinutes = actualMinutes - estimatedMinutes
  const percentDeviation =
    estimatedMinutes > 0
      ? Math.round((differenceMinutes / estimatedMinutes) * 100)
      : null
  return {
    estimatedMinutes,
    actualMinutes,
    differenceMinutes,
    percentDeviation,
  }
}
