import type { Database } from 'sqlite'
import type { Attachment, AttachmentRow } from '../types'
import { getDatabase } from '../config/database'

function mapAttachmentRow(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    taskId: row.taskId,
    fileName: row.fileName,
    originalName: row.originalName || row.fileName,
    mimeType: row.mimeType || 'application/octet-stream',
    size: row.size,
    path: row.path,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getAttachmentById(
  id: string,
  db?: Database
): Promise<(Attachment & { taskId: string }) | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<AttachmentRow>(
    `SELECT id, taskId, fileName, originalName, mimeType, size, path, createdAt, updatedAt
     FROM attachments WHERE id = ?`,
    [id]
  )
  return row ? { ...mapAttachmentRow(row), taskId: row.taskId } : undefined
}

export async function getAttachmentsByTaskId(
  taskId: string,
  db?: Database
): Promise<Attachment[]> {
  const connection = db ?? (await getDatabase())
  const rows = (await connection.all(
    `SELECT id, taskId, fileName, originalName, mimeType, size, path, createdAt, updatedAt
     FROM attachments WHERE taskId = ? ORDER BY createdAt DESC`,
    [taskId]
  )) as AttachmentRow[]
  return rows.map(mapAttachmentRow)
}

export async function addAttachment(
  taskId: string,
  attachment: Omit<Attachment, 'taskId'>,
  db?: Database
): Promise<Attachment> {
  const connection = db ?? (await getDatabase())
  const now = new Date().toISOString()

  await connection.run(
    `INSERT INTO attachments (
      id, taskId, fileName, originalName, mimeType, size, path, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      attachment.id,
      taskId,
      attachment.fileName,
      attachment.originalName,
      attachment.mimeType,
      attachment.size,
      attachment.path,
      attachment.createdAt || now,
      attachment.updatedAt || now,
    ]
  )

  return { ...attachment, taskId, createdAt: attachment.createdAt || now, updatedAt: attachment.updatedAt || now }
}

export async function deleteAttachment(id: string, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  await connection.run(`DELETE FROM attachments WHERE id = ?`, [id])
}
