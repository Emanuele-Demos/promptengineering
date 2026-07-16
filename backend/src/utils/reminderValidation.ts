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

export function isReminderType(value: unknown): value is ReminderType {
  return typeof value === 'string' && REMINDER_TYPES.includes(value as ReminderType)
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
  if (reminderType === 'none') return null
  if (!dueDate) return null

  if (reminderType === 'custom') {
    if (!customReminderDate) {
      throw new Error('Data promemoria personalizzata obbligatoria')
    }
    const parsed = new Date(customReminderDate)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Data promemoria non valida')
    }
    return parsed.toISOString()
  }

  const due = dueDateToDateTime(dueDate)
  const offset = OFFSET_MS[reminderType]
  return new Date(due.getTime() - offset).toISOString()
}

export function validateReminder(
  dueDate: string | null,
  reminderType: ReminderType,
  reminderDate: string | null
): void {
  if (reminderType === 'none' || !reminderDate) return

  if (!dueDate) {
    throw new Error('Imposta una scadenza per attivare un promemoria')
  }

  const due = dueDateToDateTime(dueDate)
  const reminder = new Date(reminderDate)

  if (Number.isNaN(reminder.getTime())) {
    throw new Error('Data promemoria non valida')
  }

  if (reminder.getTime() >= due.getTime()) {
    throw new Error('Il promemoria deve essere precedente alla scadenza del task')
  }
}

export function buildReminderMessage(
  taskTitle: string,
  reminderType: ReminderType,
  dueDate: string | null
): string {
  const label = REMINDER_LABELS[reminderType] ?? 'Promemoria'
  const dueLabel = dueDate
    ? dueDateToDateTime(dueDate).toLocaleString('it-IT', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'data non impostata'

  if (reminderType === 'custom') {
    return `Promemoria per il task "${taskTitle}". Scadenza: ${dueLabel}.`
  }

  return `Il task "${taskTitle}" scade ${label.replace(' prima', '')} (scadenza: ${dueLabel}).`
}

export function resolveReminderFields(input: {
  dueDate: string | null
  reminderType: ReminderType
  reminderDate?: string | null
  existingReminderDate?: string | null
  existingReminderType?: ReminderType | null
}): { reminderType: ReminderType; reminderDate: string | null; reminderChanged: boolean } {
  const reminderType = input.reminderType
  let reminderDate: string | null = null

  if (reminderType === 'none') {
    reminderDate = null
  } else if (reminderType === 'custom') {
    reminderDate = computeReminderDate(input.dueDate, reminderType, input.reminderDate)
  } else {
    reminderDate = computeReminderDate(input.dueDate, reminderType)
  }

  validateReminder(input.dueDate, reminderType, reminderDate)

  const reminderChanged =
    reminderType !== (input.existingReminderType ?? 'none') ||
    reminderDate !== (input.existingReminderDate ?? null)

  return { reminderType, reminderDate, reminderChanged }
}
