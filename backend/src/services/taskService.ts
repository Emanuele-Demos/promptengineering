import type { Database } from 'sqlite'
import type { Task, TaskRow } from '../types'
import { getDatabase } from '../config/database'
import { getAttachmentsByTaskId } from './attachmentService'
import { getNotesByTaskId } from './noteService'
import { categoryExists, getCategoryById } from './categoryService'
import { projectExists } from './projectService'
import type { ReminderType } from '../utils/reminderValidation'
import { parseRepeatDays, serializeRepeatDays } from '../utils/recurrenceValidation'

const TASK_SELECT = `id, title, description, notes, status, priority, assigneeId, categoryId, projectId,
  dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt,
  isRecurring, repeatType, repeatEvery, repeatCustomUnit, repeatEndType, repeatEnd,
  repeatOccurrences, occurrencesGenerated, lastGeneratedAt, nextOccurrence, parentTaskId,
  repeatDays, maxOccurrences, currentOccurrences, isRecurringActive, favorite, archived, archivedAt`

export type TaskArchivedFilter = 'exclude' | 'only' | 'all'

export interface TaskQueryOptions {
  favorite?: boolean
  assigneeId?: string
  archived?: TaskArchivedFilter
}

function mapRecurrenceToTask(row: TaskRow) {
  return {
    isRecurring: Boolean(row.isRecurring),
    isRecurringActive: Boolean(row.isRecurringActive ?? row.isRecurring),
    repeatType: (row.repeatType as Task['repeatType']) ?? null,
    repeatEvery: row.repeatEvery ?? 1,
    repeatCustomUnit: (row.repeatCustomUnit as Task['repeatCustomUnit']) ?? null,
    repeatDays: parseRepeatDays(row.repeatDays),
    repeatEndType: (row.repeatEndType as Task['repeatEndType']) ?? 'never',
    repeatEnd: row.repeatEnd,
    repeatOccurrences: row.repeatOccurrences,
    maxOccurrences: row.maxOccurrences,
    occurrencesGenerated: row.occurrencesGenerated ?? row.currentOccurrences ?? 0,
    currentOccurrences: row.currentOccurrences ?? row.occurrencesGenerated ?? 0,
    lastGeneratedAt: row.lastGeneratedAt,
    nextOccurrence: row.nextOccurrence,
    parentTaskId: row.parentTaskId,
  }
}

async function getTagsForTask(taskId: string, db: Database): Promise<string[]> {
  const rows = (await db.all(
    `SELECT tag FROM task_tags WHERE taskId = ? ORDER BY tag`,
    [taskId]
  )) as { tag: string }[]
  return rows.map((row) => row.tag)
}

async function getLinksForTask(taskId: string, db: Database): Promise<string[]> {
  const rows = (await db.all(
    `SELECT link FROM task_links WHERE taskId = ? ORDER BY link`,
    [taskId]
  )) as { link: string }[]
  return rows.map((row) => row.link)
}

export async function buildTaskFromRow(row: TaskRow, db: Database): Promise<Task> {
  const [tags, links, attachments, noteItems, category] = await Promise.all([
    getTagsForTask(row.id, db),
    getLinksForTask(row.id, db),
    getAttachmentsByTaskId(row.id, db),
    getNotesByTaskId(row.id, db),
    row.categoryId ? getCategoryById(row.categoryId, db) : Promise.resolve(undefined),
  ])

  const { reminderSentAt: _sent, isRecurring: _ir, favorite: fav, archived: arch, ...taskBase } = row

  return {
    ...taskBase,
    favorite: Boolean(fav),
    archived: Boolean(arch),
    archivedAt: row.archivedAt ?? null,
    reminderType: (row.reminderType as ReminderType | null) ?? null,
    ...mapRecurrenceToTask(row),
    tags,
    links,
    attachments,
    noteItems,
    category: category ?? null,
  }
}

async function replaceTaskTags(taskId: string, tags: string[], db: Database): Promise<void> {
  await db.run(`DELETE FROM task_tags WHERE taskId = ?`, [taskId])
  for (const tag of tags) {
    await db.run(`INSERT INTO task_tags (taskId, tag) VALUES (?, ?)`, [taskId, tag])
  }
}

async function replaceTaskLinks(taskId: string, links: string[], db: Database): Promise<void> {
  await db.run(`DELETE FROM task_links WHERE taskId = ?`, [taskId])
  for (const link of links) {
    await db.run(`INSERT INTO task_links (taskId, link) VALUES (?, ?)`, [taskId, link])
  }
}

function recurrenceInsertValues(
  task: Pick<
    Task,
    | 'isRecurring'
    | 'isRecurringActive'
    | 'repeatType'
    | 'repeatEvery'
    | 'repeatCustomUnit'
    | 'repeatDays'
    | 'repeatEndType'
    | 'repeatEnd'
    | 'repeatOccurrences'
    | 'maxOccurrences'
    | 'occurrencesGenerated'
    | 'currentOccurrences'
    | 'lastGeneratedAt'
    | 'nextOccurrence'
    | 'parentTaskId'
  >
) {
  const current = task.currentOccurrences ?? task.occurrencesGenerated ?? 0
  return [
    task.isRecurring ? 1 : 0,
    task.repeatType ?? null,
    task.repeatEvery ?? 1,
    task.repeatCustomUnit ?? null,
    task.repeatEndType ?? 'never',
    task.repeatEnd ?? null,
    task.repeatOccurrences ?? null,
    current,
    task.lastGeneratedAt ?? null,
    task.nextOccurrence ?? null,
    task.parentTaskId ?? null,
    serializeRepeatDays(task.repeatDays ?? []),
    task.maxOccurrences ?? null,
    current,
    task.isRecurringActive !== false && task.isRecurring ? 1 : 0,
  ]
}

export async function getAllTasks(
  options?: TaskQueryOptions,
  db?: Database
): Promise<Task[]> {
  const connection = db ?? (await getDatabase())
  let query = `SELECT ${TASK_SELECT} FROM tasks WHERE 1=1`
  const params: string[] = []

  const archivedFilter = options?.archived ?? 'exclude'
  if (archivedFilter === 'exclude') {
    query += ` AND (archived = 0 OR archived IS NULL)`
  } else if (archivedFilter === 'only') {
    query += ` AND archived = 1`
  }

  if (options?.favorite === true) {
    query += ` AND favorite = 1`
  } else if (options?.favorite === false) {
    query += ` AND (favorite = 0 OR favorite IS NULL)`
  }

  if (options?.assigneeId) {
    query += ` AND assigneeId = ?`
    params.push(options.assigneeId)
  }

  query +=
    archivedFilter === 'only'
      ? ` ORDER BY archivedAt DESC, createdAt DESC`
      : ` ORDER BY favorite DESC, createdAt DESC`

  const rows = (await connection.all(query, params)) as TaskRow[]

  return Promise.all(rows.map((row) => buildTaskFromRow(row, connection)))
}

export async function getTaskById(id: string, db?: Database): Promise<Task | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<TaskRow>(
    `SELECT ${TASK_SELECT} FROM tasks WHERE id = ?`,
    [id]
  )

  if (!row) return undefined
  return buildTaskFromRow(row, connection)
}

export async function createTask(task: Task, db?: Database): Promise<Task> {
  const connection = db ?? (await getDatabase())

  if (task.categoryId && !(await categoryExists(task.categoryId, connection))) {
    throw new Error('Categoria non valida')
  }
  if (task.projectId && !(await projectExists(task.projectId, connection))) {
    throw new Error('Progetto non valido')
  }

  await connection.run('BEGIN')
  try {
    await connection.run(
      `INSERT INTO tasks (
        id, title, description, notes, status, priority, assigneeId, categoryId, projectId,
        dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt,
        isRecurring, repeatType, repeatEvery, repeatCustomUnit, repeatEndType, repeatEnd,
        repeatOccurrences, occurrencesGenerated, lastGeneratedAt, nextOccurrence, parentTaskId,
        repeatDays, maxOccurrences, currentOccurrences, isRecurringActive, favorite, archived, archivedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description,
        task.notes,
        task.status,
        task.priority,
        task.assigneeId,
        task.categoryId,
        task.projectId,
        task.dueDate,
        task.reminderDate,
        task.reminderType,
        null,
        task.createdAt,
        task.updatedAt,
        ...recurrenceInsertValues(task),
        task.favorite ? 1 : 0,
        task.archived ? 1 : 0,
        task.archivedAt ?? null,
      ]
    )

    await replaceTaskTags(task.id, task.tags, connection)
    await replaceTaskLinks(task.id, task.links, connection)
    await connection.run('COMMIT')
    return buildTaskFromRow(
      {
        id: task.id,
        title: task.title,
        description: task.description,
        notes: task.notes,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        categoryId: task.categoryId,
        projectId: task.projectId ?? null,
        dueDate: task.dueDate,
        reminderDate: task.reminderDate,
        reminderType: task.reminderType,
        reminderSentAt: null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        isRecurring: task.isRecurring ? 1 : 0,
        isRecurringActive: task.isRecurringActive !== false && task.isRecurring ? 1 : 0,
        repeatType: task.repeatType ?? null,
        repeatEvery: task.repeatEvery ?? 1,
        repeatCustomUnit: task.repeatCustomUnit ?? null,
        repeatDays: serializeRepeatDays(task.repeatDays ?? []),
        repeatEndType: task.repeatEndType ?? 'never',
        repeatEnd: task.repeatEnd ?? null,
        repeatOccurrences: task.repeatOccurrences ?? null,
        maxOccurrences: task.maxOccurrences ?? null,
        occurrencesGenerated: task.currentOccurrences ?? task.occurrencesGenerated ?? 0,
        currentOccurrences: task.currentOccurrences ?? task.occurrencesGenerated ?? 0,
        lastGeneratedAt: task.lastGeneratedAt ?? null,
        nextOccurrence: task.nextOccurrence ?? null,
        parentTaskId: task.parentTaskId ?? null,
        favorite: task.favorite ? 1 : 0,
        archived: task.archived ? 1 : 0,
        archivedAt: task.archivedAt ?? null,
      },
      connection
    )
  } catch (error) {
    await connection.run('ROLLBACK')
    throw error
  }
}

export async function updateTask(
  id: string,
  task: Omit<Task, 'id' | 'noteItems' | 'attachments'>,
  options?: { resetReminderSent?: boolean },
  db?: Database
): Promise<Task> {
  const connection = db ?? (await getDatabase())

  if (task.categoryId && !(await categoryExists(task.categoryId, connection))) {
    throw new Error('Categoria non valida')
  }
  if (task.projectId && !(await projectExists(task.projectId, connection))) {
    throw new Error('Progetto non valido')
  }

  await connection.run('BEGIN')
  try {
    const existingRow = await connection.get<{ reminderSentAt: string | null }>(
      `SELECT reminderSentAt FROM tasks WHERE id = ?`,
      [id]
    )
    const reminderSentAt = options?.resetReminderSent
      ? null
      : (existingRow?.reminderSentAt ?? null)

    await connection.run(
      `UPDATE tasks SET
        title = ?, description = ?, notes = ?, status = ?, priority = ?,
        assigneeId = ?, categoryId = ?, projectId = ?, dueDate = ?,
        reminderDate = ?, reminderType = ?,
        reminderSentAt = ?, updatedAt = ?,
        isRecurring = ?, repeatType = ?, repeatEvery = ?, repeatCustomUnit = ?,
        repeatEndType = ?, repeatEnd = ?, repeatOccurrences = ?,
        occurrencesGenerated = ?, lastGeneratedAt = ?, nextOccurrence = ?, parentTaskId = ?,
        repeatDays = ?, maxOccurrences = ?, currentOccurrences = ?, isRecurringActive = ?,
        favorite = ?, archived = ?, archivedAt = ?
       WHERE id = ?`,
      [
        task.title,
        task.description,
        task.notes,
        task.status,
        task.priority,
        task.assigneeId,
        task.categoryId,
        task.projectId,
        task.dueDate,
        task.reminderDate,
        task.reminderType,
        reminderSentAt,
        task.updatedAt,
        ...recurrenceInsertValues(task),
        task.favorite ? 1 : 0,
        task.archived ? 1 : 0,
        task.archivedAt ?? null,
        id,
      ]
    )

    await replaceTaskTags(id, task.tags, connection)
    await replaceTaskLinks(id, task.links, connection)
    await connection.run('COMMIT')

    const updated = await getTaskById(id, connection)
    if (!updated) throw new Error('Task non trovato')
    return updated
  } catch (error) {
    await connection.run('ROLLBACK')
    throw error
  }
}

export async function deleteTask(id: string, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  await connection.run(`DELETE FROM tasks WHERE id = ?`, [id])
}

export async function archiveTask(id: string, db?: Database): Promise<Task> {
  const connection = db ?? (await getDatabase())
  const existing = await getTaskById(id, connection)
  if (!existing) throw new Error('Task non trovato')
  if (existing.archived) throw new Error('Task già archiviato')

  const now = new Date().toISOString()
  await connection.run(
    `UPDATE tasks SET archived = 1, archivedAt = ?, updatedAt = ? WHERE id = ?`,
    [now, now, id]
  )

  const updated = await getTaskById(id, connection)
  if (!updated) throw new Error('Task non trovato')
  return updated
}

export async function restoreTask(id: string, db?: Database): Promise<Task> {
  const connection = db ?? (await getDatabase())
  const existing = await getTaskById(id, connection)
  if (!existing) throw new Error('Task non trovato')
  if (!existing.archived) throw new Error('Task non archiviato')

  const now = new Date().toISOString()
  await connection.run(
    `UPDATE tasks SET archived = 0, archivedAt = NULL, updatedAt = ? WHERE id = ?`,
    [now, id]
  )

  const updated = await getTaskById(id, connection)
  if (!updated) throw new Error('Task non trovato')
  return updated
}

export async function upsertTask(
  task: Task,
  options?: { resetReminderSent?: boolean },
  db?: Database
): Promise<Task> {
  const connection = db ?? (await getDatabase())
  const existing = await getTaskById(task.id, connection)
  if (existing) {
    return updateTask(task.id, task, options, connection)
  }
  return createTask(task, connection)
}
