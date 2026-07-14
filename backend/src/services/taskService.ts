import type { Database } from 'sqlite'
import type { Task, TaskRow } from '../types'
import { getDatabase } from '../config/database'
import { getAttachmentsByTaskId } from './attachmentService'
import { getNotesByTaskId } from './noteService'
import { categoryExists, getCategoryById } from './categoryService'
import type { ReminderType } from '../utils/reminderValidation'

const TASK_SELECT = `id, title, description, notes, status, priority, assigneeId, categoryId,
  dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt`

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

  const { reminderSentAt: _sent, ...taskBase } = row

  return {
    ...taskBase,
    reminderType: (row.reminderType as import('../utils/reminderValidation').ReminderType | null) ?? null,
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

export async function getAllTasks(db?: Database): Promise<Task[]> {
  const connection = db ?? (await getDatabase())
  const rows = (await connection.all(
    `SELECT ${TASK_SELECT} FROM tasks ORDER BY createdAt DESC`
  )) as TaskRow[]

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

  await connection.run('BEGIN')
  try {
    await connection.run(
      `INSERT INTO tasks (
        id, title, description, notes, status, priority, assigneeId, categoryId,
        dueDate, reminderDate, reminderType, reminderSentAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description,
        task.notes,
        task.status,
        task.priority,
        task.assigneeId,
        task.categoryId,
        task.dueDate,
        task.reminderDate,
        task.reminderType,
        null,
        task.createdAt,
        task.updatedAt,
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
        dueDate: task.dueDate,
        reminderDate: task.reminderDate,
        reminderType: task.reminderType,
        reminderSentAt: null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
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
        assigneeId = ?, categoryId = ?, dueDate = ?,
        reminderDate = ?, reminderType = ?,
        reminderSentAt = ?, updatedAt = ?
       WHERE id = ?`,
      [
        task.title,
        task.description,
        task.notes,
        task.status,
        task.priority,
        task.assigneeId,
        task.categoryId,
        task.dueDate,
        task.reminderDate,
        task.reminderType,
        reminderSentAt,
        task.updatedAt,
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
