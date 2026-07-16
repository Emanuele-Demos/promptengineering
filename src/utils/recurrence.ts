import type {
  RepeatCustomUnit,
  RepeatDay,
  RepeatEndType,
  RepeatType,
  TaskOccurrence,
} from '../types'
import {
  REPEAT_CUSTOM_UNIT_LABELS,
  REPEAT_DAY_LABELS,
  REPEAT_TYPE_LABELS,
} from '../types'

export type OccurrenceStatus = 'scheduled' | 'completed' | 'cancelled'

const DAY_TO_NUM: Record<RepeatDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

function dueDateToDate(dueDate: string): Date {
  if (dueDate.includes('T')) return new Date(dueDate)
  return new Date(`${dueDate}T12:00:00.000Z`)
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function computeNextWeeklyWithDays(
  baseDueDate: string,
  repeatDays: RepeatDay[],
  repeatEvery: number
): string {
  const selected = [...new Set(repeatDays.map((d) => DAY_TO_NUM[d]))].sort((a, b) => a - b)
  const current = dueDateToDate(baseDueDate)
  const currentDow = current.getUTCDay()

  for (const dow of selected) {
    if (dow > currentDow) {
      const next = new Date(current)
      next.setUTCDate(next.getUTCDate() + (dow - currentDow))
      return toDateOnlyString(next)
    }
  }

  const next = new Date(current)
  const daysUntilEndOfWeek = 7 - currentDow
  const weeksToSkip = Math.max(repeatEvery - 1, 0) * 7
  next.setUTCDate(next.getUTCDate() + daysUntilEndOfWeek + weeksToSkip + selected[0])
  return toDateOnlyString(next)
}

function computeNextOccurrenceDate(
  baseDueDate: string,
  repeatType: RepeatType,
  repeatEvery: number,
  repeatCustomUnit: RepeatCustomUnit | null,
  repeatDays: RepeatDay[] = []
): string {
  if (repeatType === 'weekly' && repeatDays.length > 0) {
    return computeNextWeeklyWithDays(baseDueDate, repeatDays, repeatEvery)
  }

  const base = dueDateToDate(baseDueDate)
  const next = new Date(base)

  switch (repeatType) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + repeatEvery)
      break
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + repeatEvery * 7)
      break
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + repeatEvery)
      break
    case 'yearly':
      next.setUTCFullYear(next.getUTCFullYear() + repeatEvery)
      break
    case 'custom': {
      const unit = repeatCustomUnit ?? 'days'
      if (unit === 'hours') return new Date(next.getTime() + repeatEvery * 3600000).toISOString()
      if (unit === 'days') next.setUTCDate(next.getUTCDate() + repeatEvery)
      else if (unit === 'weeks') next.setUTCDate(next.getUTCDate() + repeatEvery * 7)
      else if (unit === 'months') next.setUTCMonth(next.getUTCMonth() + repeatEvery)
      else if (unit === 'years') next.setUTCFullYear(next.getUTCFullYear() + repeatEvery)
      break
    }
  }

  return toDateOnlyString(next)
}

function getEffectiveMax(fields: {
  maxOccurrences?: number | null
  repeatEndType?: RepeatEndType
  repeatOccurrences?: number | null
}): number | null {
  if (fields.maxOccurrences != null && fields.maxOccurrences > 0) return fields.maxOccurrences
  if (fields.repeatEndType === 'occurrences' && fields.repeatOccurrences) return fields.repeatOccurrences
  return null
}

export function generateOccurrencesPreview(
  fields: {
    isRecurring?: boolean
    isRecurringActive?: boolean
    repeatType?: RepeatType | null
    repeatEvery?: number
    repeatCustomUnit?: RepeatCustomUnit | null
    repeatDays?: RepeatDay[]
    repeatEndType?: RepeatEndType
    repeatEnd?: string | null
    repeatOccurrences?: number | null
    maxOccurrences?: number | null
    dueDate?: string | null
    status?: string
  },
  limit = 52
): TaskOccurrence[] {
  if (!fields.isRecurring || !fields.repeatType || !fields.dueDate) return []

  const today = new Date().toISOString().slice(0, 10)
  const time = fields.dueDate.includes('T') ? fields.dueDate.slice(11, 16) : null
  const results: TaskOccurrence[] = []
  let cursor = fields.dueDate.slice(0, 10)
  let sequence = 1
  const maxOcc = getEffectiveMax(fields)
  const active = fields.isRecurringActive !== false

  while (results.length < limit) {
    if (maxOcc != null && sequence > maxOcc) break
    if (fields.repeatEndType === 'date' && fields.repeatEnd && cursor > fields.repeatEnd) break

    let status: OccurrenceStatus = 'scheduled'
    if (fields.status === 'done' && cursor === fields.dueDate.slice(0, 10)) {
      status = 'completed'
    } else if (cursor < today) {
      status = 'completed'
    } else if (!active) {
      status = 'cancelled'
    }

    results.push({ date: cursor, time, status, sequence })

    const next = computeNextOccurrenceDate(
      cursor,
      fields.repeatType,
      fields.repeatEvery ?? 1,
      fields.repeatCustomUnit ?? null,
      fields.repeatDays ?? []
    )
    cursor = next.includes('T') ? next.slice(0, 10) : next
    if (results.length > 0 && results[results.length - 1].date === cursor) break
    sequence += 1
  }

  return results
}

export function formatRecurrenceSummary(fields: {
  isRecurring?: boolean
  isRecurringActive?: boolean
  repeatType?: RepeatType | null
  repeatEvery?: number
  repeatCustomUnit?: RepeatCustomUnit | null
  repeatDays?: RepeatDay[]
  repeatEndType?: RepeatEndType
  repeatEnd?: string | null
  repeatOccurrences?: number | null
  maxOccurrences?: number | null
}): string {
  if (!fields.isRecurring || !fields.repeatType) return ''

  const every = fields.repeatEvery ?? 1
  let freq: string

  if (fields.repeatType === 'weekly' && fields.repeatDays && fields.repeatDays.length > 0) {
    const dayNames = fields.repeatDays.map((d) => REPEAT_DAY_LABELS[d]).join(', ')
    freq = every === 1 ? `Ogni ${dayNames}` : `Ogni ${every} settimane (${dayNames})`
  } else if (fields.repeatType === 'custom') {
    const unit = REPEAT_CUSTOM_UNIT_LABELS[fields.repeatCustomUnit ?? 'days'].toLowerCase()
    freq = every === 1 ? `Ogni ${unit.slice(0, -1)}` : `Ogni ${every} ${unit}`
  } else {
    const label = REPEAT_TYPE_LABELS[fields.repeatType].replace(/^Ogni /, '').toLowerCase()
    freq = every === 1 ? `Ogni ${label}` : `Ogni ${every} ${label}`
  }

  const maxOcc = getEffectiveMax(fields)
  if (maxOcc != null) freq += `, max ${maxOcc} ripetizioni`

  if (fields.repeatEndType === 'date' && fields.repeatEnd) {
    const d = new Date(fields.repeatEnd)
    return `${freq} fino al ${d.toLocaleDateString('it-IT')}`
  }
  if (fields.isRecurringActive === false) return `${freq} (interrotta)`
  return freq
}

export function validateRecurrenceClient(
  isRecurring: boolean,
  dueDate: string | null,
  repeatEvery: number,
  repeatEndType: RepeatEndType,
  repeatEnd: string | null,
  repeatOccurrences: number | null,
  repeatType: RepeatType,
  repeatCustomUnit: RepeatCustomUnit | null,
  repeatDays: RepeatDay[],
  maxOccurrences: number | null
): string | null {
  if (!isRecurring) return null
  if (!dueDate) return 'Imposta una scadenza per attivare un task ricorrente'
  if (!Number.isInteger(repeatEvery) || repeatEvery <= 0) {
    return 'L\'intervallo deve essere un numero maggiore di zero'
  }
  if (repeatType === 'custom' && !repeatCustomUnit) {
    return 'Seleziona l\'unità per la ricorrenza personalizzata'
  }
  if (repeatType === 'weekly' && repeatDays.length === 0) {
    return 'Seleziona almeno un giorno della settimana'
  }
  if (maxOccurrences != null && maxOccurrences <= 0) {
    return 'Il numero massimo di ripetizioni deve essere maggiore di zero'
  }
  if (repeatEndType === 'date') {
    if (!repeatEnd) return 'Specificare la data di fine ricorrenza'
    if (new Date(repeatEnd).getTime() < new Date(dueDate).getTime()) {
      return 'La data di fine non può precedere la scadenza iniziale'
    }
  }
  if (repeatEndType === 'occurrences' && (!repeatOccurrences || repeatOccurrences <= 0)) {
    return 'Il numero di occorrenze deve essere maggiore di zero'
  }
  return null
}

export function formatNextOccurrence(nextOccurrence: string | null | undefined): string | null {
  if (!nextOccurrence) return null
  const d = new Date(nextOccurrence)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const OCCURRENCE_STATUS_LABELS: Record<OccurrenceStatus, string> = {
  scheduled: 'Programmata',
  completed: 'Completata',
  cancelled: 'Annullata',
}
