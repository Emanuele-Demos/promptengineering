export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
export type RepeatCustomUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years'
export type RepeatEndType = 'never' | 'occurrences' | 'date'

export const REPEAT_TYPES: RepeatType[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom']
export const REPEAT_CUSTOM_UNITS: RepeatCustomUnit[] = ['hours', 'days', 'weeks', 'months', 'years']
export const REPEAT_END_TYPES: RepeatEndType[] = ['never', 'occurrences', 'date']

export interface RecurrenceFields {
  isRecurring: boolean
  repeatType: RepeatType | null
  repeatEvery: number
  repeatCustomUnit: RepeatCustomUnit | null
  repeatEndType: RepeatEndType
  repeatEnd: string | null
  repeatOccurrences: number | null
  occurrencesGenerated: number
  lastGeneratedAt: string | null
  nextOccurrence: string | null
  parentTaskId: string | null
}

export function isRepeatType(value: unknown): value is RepeatType {
  return typeof value === 'string' && REPEAT_TYPES.includes(value as RepeatType)
}

export function isRepeatCustomUnit(value: unknown): value is RepeatCustomUnit {
  return typeof value === 'string' && REPEAT_CUSTOM_UNITS.includes(value as RepeatCustomUnit)
}

export function isRepeatEndType(value: unknown): value is RepeatEndType {
  return typeof value === 'string' && REPEAT_END_TYPES.includes(value as RepeatEndType)
}

function dueDateToDate(dueDate: string): Date {
  if (dueDate.includes('T')) return new Date(dueDate)
  return new Date(`${dueDate}T12:00:00.000Z`)
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function computeNextOccurrenceDate(
  baseDueDate: string,
  repeatType: RepeatType,
  repeatEvery: number,
  repeatCustomUnit: RepeatCustomUnit | null
): string {
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
      if (unit === 'hours') {
        next.setTime(next.getTime() + repeatEvery * 60 * 60 * 1000)
        return next.toISOString()
      }
      if (unit === 'days') next.setUTCDate(next.getUTCDate() + repeatEvery)
      else if (unit === 'weeks') next.setUTCDate(next.getUTCDate() + repeatEvery * 7)
      else if (unit === 'months') next.setUTCMonth(next.getUTCMonth() + repeatEvery)
      else if (unit === 'years') next.setUTCFullYear(next.getUTCFullYear() + repeatEvery)
      break
    }
  }

  return toDateOnlyString(next)
}

export function dueDateToNextOccurrenceIso(dueDate: string): string {
  if (dueDate.includes('T')) return dueDate
  return `${dueDate}T23:59:59.999Z`
}

export function validateRecurrenceInput(input: {
  isRecurring: boolean
  repeatType?: RepeatType | null
  repeatEvery?: number
  repeatCustomUnit?: RepeatCustomUnit | null
  repeatEndType?: RepeatEndType
  repeatEnd?: string | null
  repeatOccurrences?: number | null
  dueDate?: string | null
}): void {
  if (!input.isRecurring) return

  if (!input.repeatType || !isRepeatType(input.repeatType)) {
    throw new Error('Tipo di ricorrenza non valido')
  }

  const every = input.repeatEvery ?? 1
  if (!Number.isInteger(every) || every <= 0) {
    throw new Error('L\'intervallo di ricorrenza (repeatEvery) deve essere maggiore di zero')
  }

  if (input.repeatType === 'custom' && !isRepeatCustomUnit(input.repeatCustomUnit)) {
    throw new Error('Specificare l\'unità per la ricorrenza personalizzata')
  }

  const endType = input.repeatEndType ?? 'never'
  if (!isRepeatEndType(endType)) {
    throw new Error('Modalità di fine ricorrenza non valida')
  }

  if (endType === 'date') {
    if (!input.repeatEnd) {
      throw new Error('Specificare la data di fine ricorrenza')
    }
    const endDate = dueDateToDate(input.repeatEnd)
    if (Number.isNaN(endDate.getTime())) {
      throw new Error('Data di fine ricorrenza non valida')
    }
    if (input.dueDate) {
      const start = dueDateToDate(input.dueDate)
      if (endDate.getTime() < start.getTime()) {
        throw new Error('La data di fine ricorrenza non può precedere la scadenza iniziale')
      }
    }
  }

  if (endType === 'occurrences') {
    const occ = input.repeatOccurrences ?? 0
    if (!Number.isInteger(occ) || occ <= 0) {
      throw new Error('Il numero di occorrenze deve essere maggiore di zero')
    }
  }

  if (!input.dueDate) {
    throw new Error('Imposta una scadenza per attivare un task ricorrente')
  }
}

export function shouldStopRecurrence(
  fields: Pick<
    RecurrenceFields,
    'repeatEndType' | 'repeatEnd' | 'repeatOccurrences' | 'occurrencesGenerated'
  >,
  nextDueDate: string
): boolean {
  if (fields.repeatEndType === 'date' && fields.repeatEnd) {
    const end = dueDateToDate(fields.repeatEnd)
    const next = dueDateToDate(nextDueDate)
    if (next.getTime() > end.getTime()) return true
  }

  if (fields.repeatEndType === 'occurrences' && fields.repeatOccurrences != null) {
    if (fields.occurrencesGenerated + 1 >= fields.repeatOccurrences) return true
  }

  return false
}

export function resolveRecurrenceFields(input: {
  isRecurring: boolean
  repeatType?: RepeatType | null
  repeatEvery?: number
  repeatCustomUnit?: RepeatCustomUnit | null
  repeatEndType?: RepeatEndType
  repeatEnd?: string | null
  repeatOccurrences?: number | null
  dueDate?: string | null
  existing?: Partial<RecurrenceFields>
}): RecurrenceFields {
  const isRecurring = Boolean(input.isRecurring)

  if (!isRecurring) {
    return {
      isRecurring: false,
      repeatType: null,
      repeatEvery: 1,
      repeatCustomUnit: null,
      repeatEndType: 'never',
      repeatEnd: null,
      repeatOccurrences: null,
      occurrencesGenerated: 0,
      lastGeneratedAt: null,
      nextOccurrence: null,
      parentTaskId: input.existing?.parentTaskId ?? null,
    }
  }

  const repeatType = input.repeatType ?? input.existing?.repeatType ?? 'daily'
  const repeatEvery = input.repeatEvery ?? input.existing?.repeatEvery ?? 1
  const repeatCustomUnit =
    repeatType === 'custom'
      ? (input.repeatCustomUnit ?? input.existing?.repeatCustomUnit ?? 'days')
      : null
  const repeatEndType = input.repeatEndType ?? input.existing?.repeatEndType ?? 'never'
  const repeatEnd =
    repeatEndType === 'date'
      ? (input.repeatEnd ?? input.existing?.repeatEnd ?? null)
      : null
  const repeatOccurrences =
    repeatEndType === 'occurrences'
      ? (input.repeatOccurrences ?? input.existing?.repeatOccurrences ?? null)
      : null
  const dueDate = input.dueDate ?? null

  validateRecurrenceInput({
    isRecurring,
    repeatType,
    repeatEvery,
    repeatCustomUnit,
    repeatEndType,
    repeatEnd,
    repeatOccurrences,
    dueDate,
  })

  const nextOccurrence = dueDate ? dueDateToNextOccurrenceIso(dueDate) : null

  return {
    isRecurring: true,
    repeatType,
    repeatEvery,
    repeatCustomUnit,
    repeatEndType,
    repeatEnd,
    repeatOccurrences,
    occurrencesGenerated: input.existing?.occurrencesGenerated ?? 1,
    lastGeneratedAt: input.existing?.lastGeneratedAt ?? null,
    nextOccurrence,
    parentTaskId: input.existing?.parentTaskId ?? null,
  }
}

const REPEAT_LABELS: Record<RepeatType, string> = {
  daily: 'giorno',
  weekly: 'settimana',
  monthly: 'mese',
  yearly: 'anno',
  custom: 'personalizzata',
}

const UNIT_LABELS: Record<RepeatCustomUnit, string> = {
  hours: 'ore',
  days: 'giorni',
  weeks: 'settimane',
  months: 'mesi',
  years: 'anni',
}

export function formatRecurrenceSummary(fields: Partial<RecurrenceFields>): string {
  if (!fields.isRecurring || !fields.repeatType) return ''

  const every = fields.repeatEvery ?? 1
  let freq: string

  if (fields.repeatType === 'custom') {
    const unit = UNIT_LABELS[fields.repeatCustomUnit ?? 'days']
    freq = every === 1 ? `Ogni ${unit.slice(0, -1)}` : `Ogni ${every} ${unit}`
  } else {
    const label = REPEAT_LABELS[fields.repeatType]
    freq = every === 1 ? `Ogni ${label}` : `Ogni ${every} ${label}${every > 1 ? 'i' : ''}`
  }

  if (fields.repeatEndType === 'date' && fields.repeatEnd) {
    const d = new Date(fields.repeatEnd)
    return `${freq} fino al ${d.toLocaleDateString('it-IT')}`
  }
  if (fields.repeatEndType === 'occurrences' && fields.repeatOccurrences) {
    return `${freq}, ${fields.repeatOccurrences} ripetizioni`
  }
  return freq
}
