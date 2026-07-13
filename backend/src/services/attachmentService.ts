import type { Database } from 'sqlite'
import type { Attachment, AttachmentRow } from '../types'
import { getDatabase } from '../config/database'

export async function getAttachmentById(
  id: string,
  db?: Database
): Promise<(Attachment & { taskId: string }) | undefined> {
  const connection = db ?? (await getDatabase())
  return connection.get<AttachmentRow>(
    `SELECT id, taskId, fileName, path, type, size FROM attachments WHERE id = ?`,
    [id]
  )
}

export async function getAttachmentsByTaskId(
  taskId: string,
  db?: Database
): Promise<Attachment[]> {
  const connection = db ?? (await getDatabase())
  const rows = (await connection.all(
    `SELECT id, fileName, path, type, size FROM attachments WHERE taskId = ? ORDER BY fileName`,
    [taskId]
  )) as Attachment[]
  return rows
}

export async function addAttachment(
  taskId: string,
  attachment: Attachment,
  db?: Database
): Promise<Attachment> {
  const connection = db ?? (await getDatabase())
  await connection.run(
    `INSERT INTO attachments (id, taskId, fileName, path, type, size) VALUES (?, ?, ?, ?, ?, ?)`,
    [attachment.id, taskId, attachment.fileName, attachment.path, attachment.type, attachment.size]
  )
  return attachment
}

export async function deleteAttachment(id: string, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  await connection.run(`DELETE FROM attachments WHERE id = ?`, [id])
}
