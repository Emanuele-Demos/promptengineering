import type { RepeatCustomUnit, RepeatEndType, RepeatType } from '../types'
import { REPEAT_CUSTOM_UNIT_LABELS, REPEAT_TYPE_LABELS } from '../types'

export function formatRecurrenceSummary(fields: {
  isRecurring?: boolean
  repeatType?: RepeatType | null
  repeatEvery?: number
  repeatCustomUnit?: RepeatCustomUnit | null
  repeatEndType?: RepeatEndType
  repeatEnd?: string | null
  repeatOccurrences?: number | null
}): string {
  if (!fields.isRecurring || !fields.repeatType) return ''

  const every = fields.repeatEvery ?? 1

  let freq: string
  if (fields.repeatType === 'custom') {
    const unit = REPEAT_CUSTOM_UNIT_LABELS[fields.repeatCustomUnit ?? 'days'].toLowerCase()
    freq = every === 1 ? `Ogni ${unit.slice(0, -1)}` : `Ogni ${every} ${unit}`
  } else {
    const label = REPEAT_TYPE_LABELS[fields.repeatType].replace(/^Ogni /, '').toLowerCase()
    freq = every === 1 ? `Ogni ${label}` : `Ogni ${every} ${label}`
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

export function validateRecurrenceClient(
  isRecurring: boolean,
  dueDate: string | null,
  repeatEvery: number,
  repeatEndType: RepeatEndType,
  repeatEnd: string | null,
  repeatOccurrences: number | null,
  repeatType: RepeatType,
  repeatCustomUnit: RepeatCustomUnit | null
): string | null {
  if (!isRecurring) return null

  if (!dueDate) return 'Imposta una scadenza per attivare un task ricorrente'

  if (!Number.isInteger(repeatEvery) || repeatEvery <= 0) {
    return 'L\'intervallo deve essere un numero maggiore di zero'
  }

  if (repeatType === 'custom' && !repeatCustomUnit) {
    return 'Seleziona l\'unità per la ricorrenza personalizzata'
  }

  if (repeatEndType === 'date') {
    if (!repeatEnd) return 'Specificare la data di fine ricorrenza'
    const end = new Date(repeatEnd)
    const start = new Date(dueDate)
    if (end.getTime() < start.getTime()) {
      return 'La data di fine non può precedere la scadenza iniziale'
    }
  }

  if (repeatEndType === 'occurrences') {
    if (!repeatOccurrences || repeatOccurrences <= 0) {
      return 'Il numero di occorrenze deve essere maggiore di zero'
    }
  }

  return null
}

export function formatNextOccurrence(nextOccurrence: string | null | undefined): string | null {
  if (!nextOccurrence) return null
  const d = new Date(nextOccurrence)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}
