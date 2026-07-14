import { randomUUID } from 'crypto'
import type { Database } from 'sqlite'
import { getDatabase } from '../config/database'
import type { Task, TaskRow } from '../types'
import {
  computeNextOccurrenceDate,
  dueDateToNextOccurrenceIso,
  parseRepeatDays,
  serializeRepeatDays,
  shouldStopRecurrence,
  type RecurrenceFields,
} from '../utils/recurrenceValidation'
import { resolveReminderFields } from '../utils/reminderValidation'
import { getAttachmentsByTaskId, addAttachment } from './attachmentService'

const RECURRING_SELECT = `id, title, description, notes, status, priority, assigneeId, categoryId, projectId,
  dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt,
  isRecurring, repeatType, repeatEvery, repeatCustomUnit, repeatEndType, repeatEnd,
  repeatOccurrences, occurrencesGenerated, lastGeneratedAt, nextOccurrence, parentTaskId,
  repeatDays, maxOccurrences, currentOccurrences, isRecurringActive, favorite, archived, archivedAt`

function mapRecurrenceFromRow(row: TaskRow): RecurrenceFields {
  const current = row.currentOccurrences ?? row.occurrencesGenerated ?? 1
  return {
    isRecurring: Boolean(row.isRecurring),
    isRecurringActive: Boolean(row.isRecurringActive ?? row.isRecurring),
    repeatType: (row.repeatType as RecurrenceFields['repeatType']) ?? null,
    repeatEvery: row.repeatEvery ?? 1,
    repeatCustomUnit: (row.repeatCustomUnit as RecurrenceFields['repeatCustomUnit']) ?? null,
    repeatDays: parseRepeatDays(row.repeatDays),
    repeatEndType: (row.repeatEndType as RecurrenceFields['repeatEndType']) ?? 'never',
    repeatEnd: row.repeatEnd,
    repeatOccurrences: row.repeatOccurrences,
    maxOccurrences: row.maxOccurrences,
    occurrencesGenerated: current,
    currentOccurrences: current,
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

async function generateNextInstance(source: TaskRow, db: Database): Promise<boolean> {
  const recurrence = mapRecurrenceFromRow(source)
  if (!recurrence.isRecurring || !recurrence.isRecurringActive || !recurrence.repeatType || !source.dueDate) {
    return false
  }

  const nextDueDate = computeNextOccurrenceDate(
    source.dueDate,
    recurrence.repeatType,
    recurrence.repeatEvery,
    recurrence.repeatCustomUnit,
    recurrence.repeatDays
  )

  const stop = shouldStopRecurrence(recurrence, nextDueDate)

  const now = new Date().toISOString()
  const newId = randomUUID()
  const seriesRoot = source.parentTaskId ?? source.id
  const nextCurrent = recurrence.currentOccurrences + 1

  const { reminderDate } = resolveReminderFields({
    dueDate: nextDueDate,
    reminderType: (source.reminderType as import('../utils/reminderValidation').ReminderType) ?? 'none',
    reminderDate: null,
    existingReminderDate: null,
    existingReminderType: null,
  })

  const newRecurrence: RecurrenceFields = {
    ...recurrence,
    currentOccurrences: nextCurrent,
    occurrencesGenerated: nextCurrent,
    lastGeneratedAt: now,
    nextOccurrence: stop ? null : dueDateToNextOccurrenceIso(nextDueDate),
    parentTaskId: seriesRoot,
    isRecurring: !stop,
    isRecurringActive: !stop,
  }

  const tags = (await db.all(`SELECT tag FROM task_tags WHERE taskId = ?`, [source.id])) as {
    tag: string
  }[]
  const links = (await db.all(`SELECT link FROM task_links WHERE taskId = ?`, [source.id])) as {
    link: string
  }[]

  await db.run('BEGIN')
  try {
    await db.run(
      `UPDATE tasks SET status = 'done', isRecurring = 0, isRecurringActive = 0, nextOccurrence = NULL, updatedAt = ? WHERE id = ?`,
      [now, source.id]
    )

    await db.run(
      `INSERT INTO tasks (
        id, title, description, notes, status, priority, assigneeId, categoryId, projectId,
        dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt,
        isRecurring, repeatType, repeatEvery, repeatCustomUnit, repeatEndType, repeatEnd,
        repeatOccurrences, occurrencesGenerated, lastGeneratedAt, nextOccurrence, parentTaskId,
        repeatDays, maxOccurrences, currentOccurrences, isRecurringActive, favorite, archived, archivedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        source.title,
        source.description,
        source.notes,
        'todo',
        source.priority,
        source.assigneeId,
        source.categoryId,
        source.projectId,
        nextDueDate,
        reminderDate,
        source.reminderType,
        null,
        now,
        now,
        newRecurrence.isRecurring ? 1 : 0,
        newRecurrence.repeatType,
        newRecurrence.repeatEvery,
        newRecurrence.repeatCustomUnit,
        newRecurrence.repeatEndType,
        newRecurrence.repeatEnd,
        newRecurrence.repeatOccurrences,
        nextCurrent,
        now,
        newRecurrence.nextOccurrence,
        seriesRoot,
        serializeRepeatDays(newRecurrence.repeatDays),
        newRecurrence.maxOccurrences,
        nextCurrent,
        newRecurrence.isRecurringActive ? 1 : 0,
        source.favorite ? 1 : 0,
        0,
        null,
      ]
    )

    for (const tag of tags) {
      await db.run(`INSERT INTO task_tags (taskId, tag) VALUES (?, ?)`, [newId, tag.tag])
    }
    for (const link of links) {
      await db.run(`INSERT INTO task_links (taskId, link) VALUES (?, ?)`, [newId, link.link])
    }

    await copyAttachments(source.id, newId, db)
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
       AND isRecurringActive = 1
       AND nextOccurrence IS NOT NULL
       AND nextOccurrence <= ?
       AND status != 'done'
       AND (archived = 0 OR archived IS NULL)`,
    [now]
  )) as TaskRow[]

  let processed = 0

  for (const row of dueTasks) {
    const fresh = await connection.get<TaskRow>(
      `SELECT ${RECURRING_SELECT} FROM tasks WHERE id = ? AND isRecurring = 1 AND isRecurringActive = 1`,
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
