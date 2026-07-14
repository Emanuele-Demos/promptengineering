import type { Request, Response } from 'express'
import * as notificationService from '../services/notificationService'
import { getUserId } from '../middleware/userContext'
import { getParam } from '../utils/params'

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req)
  const filter = (req.query.filter as string) ?? 'all'
  const validFilter = filter === 'read' || filter === 'unread' ? filter : 'all'
  const notifications = await notificationService.getNotificationsByUserId(userId, validFilter)
  res.json(notifications)
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req)
  const count = await notificationService.getUnreadCount(userId)
  res.json({ count })
}

export async function getNotification(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req)
  const notification = await notificationService.getNotificationById(getParam(req.params.id))

  if (!notification) {
    res.status(404).json({ message: 'Notifica non trovata' })
    return
  }

  if (notification.userId !== userId) {
    res.status(403).json({ message: 'Non autorizzato' })
    return
  }

  res.json(notification)
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req)
  const notification = await notificationService.markNotificationAsRead(
    getParam(req.params.id),
    userId
  )
  res.json(notification)
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req)
  await notificationService.deleteNotification(getParam(req.params.id), userId)
  res.json({ message: 'Notifica eliminata' })
}
