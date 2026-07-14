import { randomUUID } from 'crypto'
import type { Database } from 'sqlite'
import type { Notification } from '../types'
import { getDatabase } from '../config/database'

interface NotificationRow {
  id: string
  userId: string
  taskId: string
  title: string
  message: string
  isRead: number
  createdAt: string
  readAt: string | null
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    taskId: row.taskId,
    title: row.title,
    message: row.message,
    isRead: row.isRead === 1,
    createdAt: row.createdAt,
    readAt: row.readAt,
  }
}

export async function getNotificationsByUserId(
  userId: string,
  filter: 'all' | 'read' | 'unread' = 'all',
  db?: Database
): Promise<Notification[]> {
  const connection = db ?? (await getDatabase())
  let query = `SELECT id, userId, taskId, title, message, isRead, createdAt, readAt
               FROM notifications WHERE userId = ?`
  const params: string[] = [userId]

  if (filter === 'read') query += ` AND isRead = 1`
  if (filter === 'unread') query += ` AND isRead = 0`

  query += ` ORDER BY createdAt DESC`

  const rows = (await connection.all(query, params)) as NotificationRow[]
  return rows.map(mapNotification)
}

export async function getUnreadCount(userId: string, db?: Database): Promise<number> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{ count: number }>(
    `SELECT COUNT(*) AS count FROM notifications WHERE userId = ? AND isRead = 0`,
    [userId]
  )
  return row?.count ?? 0
}

export async function getNotificationById(
  id: string,
  db?: Database
): Promise<Notification | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<NotificationRow>(
    `SELECT id, userId, taskId, title, message, isRead, createdAt, readAt
     FROM notifications WHERE id = ?`,
    [id]
  )
  return row ? mapNotification(row) : undefined
}

export async function createNotification(
  input: Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'readAt'>,
  db?: Database
): Promise<Notification> {
  const connection = db ?? (await getDatabase())
  const now = new Date().toISOString()
  const id = randomUUID()

  await connection.run(
    `INSERT INTO notifications (id, userId, taskId, title, message, isRead, createdAt, readAt)
     VALUES (?, ?, ?, ?, ?, 0, ?, NULL)`,
    [id, input.userId, input.taskId, input.title, input.message, now]
  )

  return {
    id,
    ...input,
    isRead: false,
    createdAt: now,
    readAt: null,
  }
}

export async function markNotificationAsRead(
  id: string,
  userId: string,
  db?: Database
): Promise<Notification> {
  const connection = db ?? (await getDatabase())
  const existing = await getNotificationById(id, connection)

  if (!existing) throw new Error('Notifica non trovata')
  if (existing.userId !== userId) throw new Error('Non autorizzato')

  const now = new Date().toISOString()
  await connection.run(
    `UPDATE notifications SET isRead = 1, readAt = ? WHERE id = ?`,
    [now, id]
  )

  const updated = await getNotificationById(id, connection)
  if (!updated) throw new Error('Notifica non trovata')
  return updated
}

export async function deleteNotification(
  id: string,
  userId: string,
  db?: Database
): Promise<void> {
  const connection = db ?? (await getDatabase())
  const existing = await getNotificationById(id, connection)

  if (!existing) throw new Error('Notifica non trovata')
  if (existing.userId !== userId) throw new Error('Non autorizzato')

  await connection.run(`DELETE FROM notifications WHERE id = ?`, [id])
}

export async function notificationExistsForTaskReminder(
  taskId: string,
  reminderDate: string,
  db?: Database
): Promise<boolean> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{ id: string }>(
    `SELECT id FROM notifications
     WHERE taskId = ? AND createdAt >= ?`,
    [taskId, reminderDate]
  )
  return !!row
}
