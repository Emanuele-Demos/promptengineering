import { randomUUID } from 'crypto'
import type { Database } from 'sqlite'
import { getDatabase } from '../config/database'
import type { Task, TaskRow } from '../types'
import {
  computeNextOccurrenceDate,
  dueDateToNextOccurrenceIso,
  shouldStopRecurrence,
  type RecurrenceFields,
} from '../utils/recurrenceValidation'
import { resolveReminderFields } from '../utils/reminderValidation'
import { getAttachmentsByTaskId, addAttachment } from './attachmentService'

interface RecurringTaskRow extends TaskRow {
  isRecurring: number
  repeatType: string | null
  repeatEvery: number | null
  repeatCustomUnit: string | null
  repeatEndType: string | null
  repeatEnd: string | null
  repeatOccurrences: number | null
  occurrencesGenerated: number | null
  lastGeneratedAt: string | null
  nextOccurrence: string | null
  parentTaskId: string | null
}

const RECURRING_SELECT = `id, title, description, notes, status, priority, assigneeId, categoryId,
  dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt,
  isRecurring, repeatType, repeatEvery, repeatCustomUnit, repeatEndType, repeatEnd,
  repeatOccurrences, occurrencesGenerated, lastGeneratedAt, nextOccurrence, parentTaskId`

function mapRecurrenceFromRow(row: RecurringTaskRow): RecurrenceFields {
  return {
    isRecurring: Boolean(row.isRecurring),
    repeatType: (row.repeatType as RecurrenceFields['repeatType']) ?? null,
    repeatEvery: row.repeatEvery ?? 1,
    repeatCustomUnit: (row.repeatCustomUnit as RecurrenceFields['repeatCustomUnit']) ?? null,
    repeatEndType: (row.repeatEndType as RecurrenceFields['repeatEndType']) ?? 'never',
    repeatEnd: row.repeatEnd,
    repeatOccurrences: row.repeatOccurrences,
    occurrencesGenerated: row.occurrencesGenerated ?? 1,
    lastGeneratedAt: row.lastGeneratedAt,
    nextOccurrence: row.nextOccurrence,
    parentTaskId: row.parentTaskId,
  }
}

async function copyAttachments(sourceTaskId: string, targetTaskId: string, db: Database): Promise<void> {
  const attachments = await getAttachmentsByTaskId(sourceTaskId, db)
  const now = new Date().toISOString()

  for (const attachment of attachments) {
    await addAttachment(
      targetTaskId,
      {
        id: randomUUID(),
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        path: attachment.path,
        createdAt: now,
        updatedAt: now,
      },
      db
    )
  }
}

async function generateNextInstance(source: RecurringTaskRow, db: Database): Promise<boolean> {
  const recurrence = mapRecurrenceFromRow(source)
  if (!recurrence.isRecurring || !recurrence.repeatType || !source.dueDate) return false

  const nextDueDate = computeNextOccurrenceDate(
    source.dueDate,
    recurrence.repeatType,
    recurrence.repeatEvery,
    recurrence.repeatCustomUnit
  )

  const stop = shouldStopRecurrence(
    {
      repeatEndType: recurrence.repeatEndType,
      repeatEnd: recurrence.repeatEnd,
      repeatOccurrences: recurrence.repeatOccurrences,
      occurrencesGenerated: recurrence.occurrencesGenerated,
    },
    nextDueDate
  )

  const now = new Date().toISOString()
  const newId = randomUUID()
  const seriesRoot = source.parentTaskId ?? source.id

  const { reminderDate } = resolveReminderFields({
    dueDate: nextDueDate,
    reminderType: (source.reminderType as import('../utils/reminderValidation').ReminderType) ?? 'none',
    reminderDate: null,
    existingReminderDate: null,
    existingReminderType: null,
  })

  const newRecurrence: RecurrenceFields = {
    ...recurrence,
    occurrencesGenerated: recurrence.occurrencesGenerated + 1,
    lastGeneratedAt: now,
    nextOccurrence: dueDateToNextOccurrenceIso(nextDueDate),
    parentTaskId: seriesRoot,
    isRecurring: !stop,
  }

  if (stop) {
    newRecurrence.nextOccurrence = null
  }

  const tags = (await db.all(`SELECT tag FROM task_tags WHERE taskId = ?`, [source.id])) as {
    tag: string
  }[]
  const links = (await db.all(`SELECT link FROM task_links WHERE taskId = ?`, [source.id])) as {
    link: string
  }[]

  const newTask: Task = {
    id: newId,
    title: source.title,
    description: source.description,
    notes: source.notes,
    noteItems: [],
    links: links.map((l) => l.link),
    attachments: [],
    status: 'todo',
    priority: source.priority as Task['priority'],
    assigneeId: source.assigneeId,
    categoryId: source.categoryId,
    dueDate: nextDueDate,
    reminderDate,
    reminderType: source.reminderType as Task['reminderType'],
    tags: tags.map((t) => t.tag),
    createdAt: now,
    updatedAt: now,
    ...newRecurrence,
  }

  await db.run('BEGIN')
  try {
    await db.run(
      `UPDATE tasks SET status = 'done', isRecurring = 0, nextOccurrence = NULL, updatedAt = ? WHERE id = ?`,
      [now, source.id]
    )

    await db.run(
      `INSERT INTO tasks (
        id, title, description, notes, status, priority, assigneeId, categoryId,
        dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt,
        isRecurring, repeatType, repeatEvery, repeatCustomUnit, repeatEndType, repeatEnd,
        repeatOccurrences, occurrencesGenerated, lastGeneratedAt, nextOccurrence, parentTaskId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTask.id,
        newTask.title,
        newTask.description,
        newTask.notes,
        newTask.status,
        newTask.priority,
        newTask.assigneeId,
        newTask.categoryId,
        newTask.dueDate,
        newTask.reminderDate,
        newTask.reminderType,
        null,
        newTask.createdAt,
        newTask.updatedAt,
        newRecurrence.isRecurring ? 1 : 0,
        newRecurrence.repeatType,
        newRecurrence.repeatEvery,
        newRecurrence.repeatCustomUnit,
        newRecurrence.repeatEndType,
        newRecurrence.repeatEnd,
        newRecurrence.repeatOccurrences,
        newRecurrence.occurrencesGenerated,
        newRecurrence.lastGeneratedAt,
        newRecurrence.nextOccurrence,
        newRecurrence.parentTaskId,
      ]
    )

    for (const tag of newTask.tags) {
      await db.run(`INSERT INTO task_tags (taskId, tag) VALUES (?, ?)`, [newTask.id, tag])
    }
    for (const link of newTask.links) {
      await db.run(`INSERT INTO task_links (taskId, link) VALUES (?, ?)`, [newTask.id, link])
    }

    await copyAttachments(source.id, newTask.id, db)

    await db.run('COMMIT')
    return true
  } catch (error) {
    await db.run('ROLLBACK')
    throw error
  }
}

export async function processDueRecurrences(db?: Database): Promise<number> {
  const connection = db ?? (await getDatabase())
  const now = new Date().toISOString()

  const dueTasks = (await connection.all(
    `SELECT ${RECURRING_SELECT}
     FROM tasks
     WHERE isRecurring = 1
       AND nextOccurrence IS NOT NULL
       AND nextOccurrence <= ?
       AND status != 'done'`,
    [now]
  )) as RecurringTaskRow[]

  let processed = 0

  for (const row of dueTasks) {
    const fresh = await connection.get<RecurringTaskRow>(
      `SELECT ${RECURRING_SELECT} FROM tasks WHERE id = ? AND isRecurring = 1`,
      [row.id]
    )
    if (!fresh || !fresh.nextOccurrence || fresh.nextOccurrence > now) continue

    if (
      fresh.lastGeneratedAt &&
      fresh.nextOccurrence === row.nextOccurrence &&
      fresh.lastGeneratedAt > new Date(Date.now() - 60_000).toISOString()
    ) {
      continue
    }

    try {
      const created = await generateNextInstance(fresh, connection)
      if (created) processed += 1
    } catch (error) {
      console.error(`Errore generazione ricorrenza task ${row.id}:`, error)
    }
  }

  return processed
}
