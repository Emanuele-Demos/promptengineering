export interface NotificationDto {
  id: string
  userId: string
  taskId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt: string | null
}

export function getCurrentUserId(): string
export function setCurrentUserId(userId: string): void
export function getNotifications(filter?: 'all' | 'read' | 'unread'): Promise<NotificationDto[]>
export function getUnreadNotificationCount(): Promise<{ count: number }>
export function markNotificationAsRead(id: string): Promise<NotificationDto>
export function deleteNotification(id: string): Promise<{ message: string }>
