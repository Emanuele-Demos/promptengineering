import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function NotificationsPage() {
  const { notifications, unreadNotifications, markAllNotificationsAsRead, deleteNotification, markNotificationAsRead } = useApp()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Centro notifiche</p>
          <h1 className="text-2xl font-bold text-slate-900">Promemoria e aggiornamenti</h1>
        </div>
        <button
          onClick={markAllNotificationsAsRead}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <CheckCheck className="h-4 w-4" />
          Segna tutto come letto
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Bell className="h-4 w-4 text-indigo-500" />
          {unreadNotifications > 0 ? `${unreadNotifications} non lette` : 'Nessuna nuova notifica'}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Non ci sono notifiche da mostrare.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border p-4 ${notification.read ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 bg-indigo-50/60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString('it-IT')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white"
                      >
                        Leggi
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
