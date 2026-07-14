export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
export type RepeatCustomUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years'
export type RepeatEndType = 'never' | 'occurrences' | 'date'
export type RepeatDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type OccurrenceStatus = 'scheduled' | 'completed' | 'cancelled'

export const REPEAT_TYPES: RepeatType[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom']
export const REPEAT_CUSTOM_UNITS: RepeatCustomUnit[] = ['hours', 'days', 'weeks', 'months', 'years']
export const REPEAT_END_TYPES: RepeatEndType[] = ['never', 'occurrences', 'date']
export const REPEAT_DAYS: RepeatDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const REPEAT_DAY_LABELS: Record<RepeatDay, string> = {
  monday: 'Lunedì',
  tuesday: 'Martedì',
  wednesday: 'Mercoledì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica',
}

const DAY_TO_NUM: Record<RepeatDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export interface RecurrenceFields {
  isRecurring: boolean
  isRecurringActive: boolean
  repeatType: RepeatType | null
  repeatEvery: number
  repeatCustomUnit: RepeatCustomUnit | null
  repeatDays: RepeatDay[]
  repeatEndType: RepeatEndType
  repeatEnd: string | null
  repeatOccurrences: number | null
  maxOccurrences: number | null
  occurrencesGenerated: number
  currentOccurrences: number
  lastGeneratedAt: string | null
  nextOccurrence: string | null
  parentTaskId: string | null
}

export interface TaskOccurrence {
  date: string
  time: string | null
  status: OccurrenceStatus
  sequence: number
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

export function isRepeatDay(value: unknown): value is RepeatDay {
  return typeof value === 'string' && REPEAT_DAYS.includes(value as RepeatDay)
}

export function parseRepeatDays(value: unknown): RepeatDay[] {
  if (Array.isArray(value)) {
    return value.filter(isRepeatDay)
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) return parsed.filter(isRepeatDay)
    } catch {
      return value.split(',').map((d) => d.trim()).filter(isRepeatDay)
    }
  }
  return []
}

export function serializeRepeatDays(days: RepeatDay[]): string {
  return JSON.stringify(days)
}

function dueDateToDate(dueDate: string): Date {
  if (dueDate.includes('T')) return new Date(dueDate)
  return new Date(`${dueDate}T12:00:00.000Z`)
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getUtcDayOfWeek(date: Date): number {
  return date.getUTCDay()
}

function defaultWeeklyDays(dueDate: string | null): RepeatDay[] {
  if (!dueDate) return ['monday']
  const dow = getUtcDayOfWeek(dueDateToDate(dueDate))
  const map: RepeatDay[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  return [map[dow]]
}

export function computeNextWeeklyWithDays(
  baseDueDate: string,
  repeatDays: RepeatDay[],
  repeatEvery: number
): string {
  const selected = [...new Set(repeatDays.map((d) => DAY_TO_NUM[d]))].sort((a, b) => a - b)
  if (selected.length === 0) return computeNextOccurrenceDate(baseDueDate, 'weekly', repeatEvery, null)

  const current = dueDateToDate(baseDueDate)
  const currentDow = getUtcDayOfWeek(current)

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

export function computeNextOccurrenceDate(
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

export function extractTimeFromDueDate(dueDate: string | null): string | null {
  if (!dueDate?.includes('T')) return null
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(11, 16)
}

export function getEffectiveMaxOccurrences(fields: Partial<RecurrenceFields>): number | null {
  if (fields.maxOccurrences != null && fields.maxOccurrences > 0) return fields.maxOccurrences
  if (fields.repeatEndType === 'occurrences' && fields.repeatOccurrences != null) {
    return fields.repeatOccurrences
  }
  return null
}

export function validateRecurrenceInput(input: {
  isRecurring: boolean
  repeatType?: RepeatType | null
  repeatEvery?: number
  repeatCustomUnit?: RepeatCustomUnit | null
  repeatDays?: RepeatDay[]
  repeatEndType?: RepeatEndType
  repeatEnd?: string | null
  repeatOccurrences?: number | null
  maxOccurrences?: number | null
  currentOccurrences?: number
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

  if (input.repeatType === 'weekly') {
    const days = input.repeatDays ?? []
    if (days.length === 0) {
      throw new Error('Seleziona almeno un giorno della settimana per la ricorrenza settimanale')
    }
  }

  const maxOcc = getEffectiveMaxOccurrences(input)
  if (maxOcc != null && (!Number.isInteger(maxOcc) || maxOcc <= 0)) {
    throw new Error('maxOccurrences deve essere maggiore di zero')
  }

  const current = input.currentOccurrences ?? 1
  if (maxOcc != null && current > maxOcc) {
    throw new Error('currentOccurrences non può superare maxOccurrences')
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
    const occ = input.repeatOccurrences ?? maxOcc ?? 0
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
    | 'repeatEndType'
    | 'repeatEnd'
    | 'repeatOccurrences'
    | 'maxOccurrences'
    | 'occurrencesGenerated'
    | 'currentOccurrences'
    | 'isRecurringActive'
  >,
  nextDueDate: string
): boolean {
  if (!fields.isRecurringActive) return true

  if (fields.repeatEndType === 'date' && fields.repeatEnd) {
    const end = dueDateToDate(fields.repeatEnd)
    const next = dueDateToDate(nextDueDate)
    if (next.getTime() > end.getTime()) return true
  }

  const maxOcc = getEffectiveMaxOccurrences(fields)
  const current = fields.currentOccurrences ?? fields.occurrencesGenerated ?? 1
  if (maxOcc != null && current >= maxOcc) return true

  if (fields.repeatEndType === 'occurrences' && fields.repeatOccurrences != null) {
    if (current >= fields.repeatOccurrences) return true
  }

  return false
}

export function resolveRecurrenceFields(input: {
  isRecurring: boolean
  isRecurringActive?: boolean
  repeatType?: RepeatType | null
  repeatEvery?: number
  repeatCustomUnit?: RepeatCustomUnit | null
  repeatDays?: RepeatDay[] | unknown
  repeatEndType?: RepeatEndType
  repeatEnd?: string | null
  repeatOccurrences?: number | null
  maxOccurrences?: number | null
  dueDate?: string | null
  existing?: Partial<RecurrenceFields>
}): RecurrenceFields {
  const isRecurring = Boolean(input.isRecurring)

  if (!isRecurring) {
    return {
      isRecurring: false,
      isRecurringActive: false,
      repeatType: null,
      repeatEvery: 1,
      repeatCustomUnit: null,
      repeatDays: [],
      repeatEndType: 'never',
      repeatEnd: null,
      repeatOccurrences: null,
      maxOccurrences: null,
      occurrencesGenerated: 0,
      currentOccurrences: 0,
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
  const maxOccurrences =
    input.maxOccurrences !== undefined
      ? input.maxOccurrences
      : (input.existing?.maxOccurrences ?? null)
  const repeatOccurrences =
    repeatEndType === 'occurrences' || maxOccurrences != null
      ? (maxOccurrences ?? input.repeatOccurrences ?? input.existing?.repeatOccurrences ?? null)
      : null
  const dueDate = input.dueDate ?? null
  let repeatDays = parseRepeatDays(input.repeatDays ?? input.existing?.repeatDays ?? [])
  if (repeatType === 'weekly' && repeatDays.length === 0) {
    repeatDays = defaultWeeklyDays(dueDate)
  }

  const currentOccurrences =
    input.existing?.currentOccurrences ??
    input.existing?.occurrencesGenerated ??
    1

  validateRecurrenceInput({
    isRecurring,
    repeatType,
    repeatEvery,
    repeatCustomUnit,
    repeatDays,
    repeatEndType,
    repeatEnd,
    repeatOccurrences,
    maxOccurrences,
    currentOccurrences,
    dueDate,
  })

  const isRecurringActive =
    input.isRecurringActive !== undefined
      ? input.isRecurringActive
      : (input.existing?.isRecurringActive ?? true)

  const nextOccurrence =
    isRecurringActive && dueDate ? dueDateToNextOccurrenceIso(dueDate) : null

  return {
    isRecurring: true,
    isRecurringActive,
    repeatType,
    repeatEvery,
    repeatCustomUnit,
    repeatDays,
    repeatEndType,
    repeatEnd,
    repeatOccurrences,
    maxOccurrences,
    occurrencesGenerated: currentOccurrences,
    currentOccurrences,
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

  if (fields.repeatType === 'weekly' && fields.repeatDays && fields.repeatDays.length > 0) {
    const dayNames = fields.repeatDays.map((d) => REPEAT_DAY_LABELS[d]).join(', ')
    freq = every === 1 ? `Ogni ${dayNames}` : `Ogni ${every} settimane (${dayNames})`
  } else if (fields.repeatType === 'custom') {
    const unit = UNIT_LABELS[fields.repeatCustomUnit ?? 'days']
    freq = every === 1 ? `Ogni ${unit.slice(0, -1)}` : `Ogni ${every} ${unit}`
  } else {
    const label = REPEAT_LABELS[fields.repeatType]
    freq = every === 1 ? `Ogni ${label}` : `Ogni ${every} ${label}${every > 1 ? 'i' : ''}`
  }

  const maxOcc = getEffectiveMaxOccurrences(fields)
  if (maxOcc != null) {
    freq += `, max ${maxOcc} ripetizioni`
  }

  if (fields.repeatEndType === 'date' && fields.repeatEnd) {
    const d = new Date(fields.repeatEnd)
    return `${freq} fino al ${d.toLocaleDateString('it-IT')}`
  }
  if (fields.isRecurringActive === false) {
    return `${freq} (interrotta)`
  }
  return freq
}

export function generateOccurrences(
  fields: Partial<RecurrenceFields> & { dueDate: string; status?: string },
  options?: { limit?: number; referenceDate?: string }
): TaskOccurrence[] {
  if (!fields.isRecurring || !fields.repeatType) return []

  const limit = options?.limit ?? 52
  const today = (options?.referenceDate ?? new Date().toISOString()).slice(0, 10)
  const time = extractTimeFromDueDate(fields.dueDate)
  const results: TaskOccurrence[] = []

  let cursor = fields.dueDate.includes('T') ? fields.dueDate.slice(0, 10) : fields.dueDate
  let sequence = 1
  const maxOcc = getEffectiveMaxOccurrences(fields)
  const active = fields.isRecurringActive !== false

  while (results.length < limit) {
    if (maxOcc != null && sequence > maxOcc) break
    if (fields.repeatEndType === 'date' && fields.repeatEnd && cursor > fields.repeatEnd) break

    let status: OccurrenceStatus = 'scheduled'
    if (fields.status === 'done' && cursor === (fields.dueDate.slice(0, 10))) {
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
    if (next === cursor || next.includes('T') && next.slice(0, 10) === cursor) break
    cursor = next.includes('T') ? next.slice(0, 10) : next
    sequence += 1
  }

  return results
}
