import { useCallback, useEffect, useState } from 'react'
import {
  getNotifications,
  getUnreadNotificationCount,
} from '../api/notifications.js'
import type { Notification } from '../types'

const POLL_MS = 30_000

export function useNotifications(filter: 'all' | 'read' | 'unread' = 'all') {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [items, countData] = await Promise.all([
        getNotifications(filter) as Promise<Notification[]>,
        getUnreadNotificationCount() as Promise<{ count: number }>,
      ])
      setNotifications(items)
      setUnreadCount(countData.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return { notifications, unreadCount, loading, error, refresh }
}

export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const data = (await getUnreadNotificationCount()) as { count: number }
      setUnreadCount(data.count)
    } catch {
      /* backend offline */
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return { unreadCount, refresh }
}
