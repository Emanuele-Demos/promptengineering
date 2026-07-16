import type { Database } from 'sqlite'
import type { TaskNote, TaskNoteRow } from '../types'
import { getDatabase } from '../config/database'

export async function getNotesByTaskId(taskId: string, db?: Database): Promise<TaskNote[]> {
  const connection = db ?? (await getDatabase())
  return (await connection.all(
    `SELECT id, taskId, content, createdAt, updatedAt
     FROM task_notes WHERE taskId = ? ORDER BY createdAt ASC`,
    [taskId]
  )) as TaskNote[]
}

export async function getNoteById(id: string, db?: Database): Promise<TaskNote | undefined> {
  const connection = db ?? (await getDatabase())
  return connection.get<TaskNoteRow>(
    `SELECT id, taskId, content, createdAt, updatedAt FROM task_notes WHERE id = ?`,
    [id]
  )
}

export async function createNote(
  taskId: string,
  content: string,
  id: string,
  db?: Database
): Promise<TaskNote> {
  const connection = db ?? (await getDatabase())
  const now = new Date().toISOString()
  const trimmed = content.trim()

  await connection.run(
    `INSERT INTO task_notes (id, taskId, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    [id, taskId, trimmed, now, now]
  )

  return { id, taskId, content: trimmed, createdAt: now, updatedAt: now }
}

export async function updateNote(id: string, content: string, db?: Database): Promise<TaskNote> {
  const connection = db ?? (await getDatabase())
  const now = new Date().toISOString()
  const trimmed = content.trim()

  await connection.run(
    `UPDATE task_notes SET content = ?, updatedAt = ? WHERE id = ?`,
    [trimmed, now, id]
  )

  const note = await getNoteById(id, connection)
  if (!note) throw new Error('Nota non trovata')
  return note
}

export async function deleteNote(id: string, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  await connection.run(`DELETE FROM task_notes WHERE id = ?`, [id])
}
