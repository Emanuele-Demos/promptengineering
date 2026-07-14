export type ReminderType = 'none' | '5m' | '30m' | '1h' | '1d' | 'custom'

export const REMINDER_TYPES: ReminderType[] = ['none', '5m', '30m', '1h', '1d', 'custom']

const OFFSET_MS: Record<Exclude<ReminderType, 'none' | 'custom'>, number> = {
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
}

export const REMINDER_LABELS: Record<ReminderType, string> = {
  none: 'Nessun promemoria',
  '5m': '5 minuti prima',
  '30m': '30 minuti prima',
  '1h': '1 ora prima',
  '1d': '1 giorno prima',
  custom: 'Personalizzato',
}

export function dueDateToDateTime(dueDate: string): Date {
  if (dueDate.includes('T')) return new Date(dueDate)
  return new Date(`${dueDate}T09:00:00.000Z`)
}

export function computeReminderDate(
  dueDate: string | null,
  reminderType: ReminderType,
  customReminderDate?: string | null
): string | null {
  if (reminderType === 'none' || !dueDate) return null
  if (reminderType === 'custom') {
    if (!customReminderDate) return null
    return new Date(customReminderDate).toISOString()
  }
  const due = dueDateToDateTime(dueDate)
  return new Date(due.getTime() - OFFSET_MS[reminderType]).toISOString()
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

export function validateReminderClient(
  dueDate: string | null,
  reminderType: ReminderType,
  customReminderDate: string | null
): string | null {
  if (reminderType === 'none') return null
  if (!dueDate) return 'Imposta una scadenza per attivare un promemoria'
  if (reminderType === 'custom') {
    if (!customReminderDate) return 'Seleziona data e ora del promemoria personalizzato'
    const reminder = new Date(customReminderDate)
    const due = dueDateToDateTime(dueDate)
    if (reminder.getTime() >= due.getTime()) {
      return 'Il promemoria deve essere precedente alla scadenza'
    }
  }
  return null
}
