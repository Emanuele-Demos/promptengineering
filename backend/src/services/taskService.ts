import type { Database } from 'sqlite'
import type { Attachment, AttachmentRow, Task, TaskRow } from '../types'
import { getDatabase } from '../config/database'

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

async function getAttachmentsForTask(taskId: string, db: Database): Promise<Attachment[]> {
  const rows = (await db.all(
    `SELECT id, taskId, fileName, path, type, size FROM attachments WHERE taskId = ? ORDER BY fileName`,
    [taskId]
  )) as AttachmentRow[]
  return rows.map(({ taskId: _taskId, ...attachment }) => attachment)
}

export async function buildTaskFromRow(row: TaskRow, db: Database): Promise<Task> {
  const [tags, links, attachments] = await Promise.all([
    getTagsForTask(row.id, db),
    getLinksForTask(row.id, db),
    getAttachmentsForTask(row.id, db),
  ])

  return {
    ...row,
    tags,
    links,
    attachments,
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
    `SELECT id, title, description, notes, status, priority, assigneeId, dueDate, createdAt, updatedAt
     FROM tasks
     ORDER BY createdAt DESC`
  )) as TaskRow[]

  return Promise.all(rows.map((row) => buildTaskFromRow(row, connection)))
}

export async function getTaskById(id: string, db?: Database): Promise<Task | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<TaskRow>(
    `SELECT id, title, description, notes, status, priority, assigneeId, dueDate, createdAt, updatedAt
     FROM tasks
     WHERE id = ?`,
    [id]
  )

  if (!row) return undefined
  return buildTaskFromRow(row, connection)
}

export async function createTask(task: Task, db?: Database): Promise<Task> {
  const connection = db ?? (await getDatabase())

  await connection.run('BEGIN')
  try {
    await connection.run(
      `INSERT INTO tasks (
        id, title, description, notes, status, priority, assigneeId, dueDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description,
        task.notes,
        task.status,
        task.priority,
        task.assigneeId,
        task.dueDate,
        task.createdAt,
        task.updatedAt,
      ]
    )

    await replaceTaskTags(task.id, task.tags, connection)
    await replaceTaskLinks(task.id, task.links, connection)

    for (const attachment of task.attachments) {
      await connection.run(
        `INSERT INTO attachments (id, taskId, fileName, path, type, size) VALUES (?, ?, ?, ?, ?, ?)`,
        [attachment.id, task.id, attachment.fileName, attachment.path, attachment.type, attachment.size]
      )
    }

    await connection.run('COMMIT')
    return task
  } catch (error) {
    await connection.run('ROLLBACK')
    throw error
  }
}

export async function updateTask(
  id: string,
  task: Omit<Task, 'id'>,
  db?: Database
): Promise<Task> {
  const connection = db ?? (await getDatabase())

  await connection.run('BEGIN')
  try {
    await connection.run(
      `UPDATE tasks SET
        title = ?, description = ?, notes = ?, status = ?, priority = ?,
        assigneeId = ?, dueDate = ?, updatedAt = ?
       WHERE id = ?`,
      [
        task.title,
        task.description,
        task.notes,
        task.status,
        task.priority,
        task.assigneeId,
        task.dueDate,
        task.updatedAt,
        id,
      ]
    )

    await replaceTaskTags(id, task.tags, connection)
    await replaceTaskLinks(id, task.links, connection)

    await connection.run(`DELETE FROM attachments WHERE taskId = ?`, [id])
    for (const attachment of task.attachments) {
      await connection.run(
        `INSERT INTO attachments (id, taskId, fileName, path, type, size) VALUES (?, ?, ?, ?, ?, ?)`,
        [attachment.id, id, attachment.fileName, attachment.path, attachment.type, attachment.size]
      )
    }

    await connection.run('COMMIT')
    return { id, ...task }
  } catch (error) {
    await connection.run('ROLLBACK')
    throw error
  }
}

export async function deleteTask(id: string, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  await connection.run(`DELETE FROM tasks WHERE id = ?`, [id])
}
