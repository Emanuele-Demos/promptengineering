import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useUnreadNotificationCount } from '../hooks/useNotifications'

export function NotificationBell() {
  const { unreadCount } = useUnreadNotificationCount()

  return (
    <Link
      to="/notifiche"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
      title="Centro notifiche"
      aria-label={`Notifiche${unreadCount ? `, ${unreadCount} non lette` : ''}`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
