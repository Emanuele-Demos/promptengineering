import { useState } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import {
  deleteNotification,
  markNotificationAsRead,
} from '../api/notifications.js'
import { useNotifications } from '../hooks/useNotifications'

type Filter = 'all' | 'read' | 'unread'

export function CentroNotifiche() {
  const [filter, setFilter] = useState<Filter>('all')
  const { notifications, unreadCount, loading, error, refresh } = useNotifications(filter)
  const [actionError, setActionError] = useState('')
  const [success, setSuccess] = useState('')

  const handleMarkRead = async (id: string) => {
    setActionError('')
    setSuccess('')
    try {
      await markNotificationAsRead(id)
      setSuccess('Notifica contrassegnata come letta')
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Errore imprevisto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa notifica?')) return
    setActionError('')
    setSuccess('')
    try {
      await deleteNotification(id)
      setSuccess('Notifica eliminata')
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Errore imprevisto')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Centro Notifiche</h1>
            <p className="text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} notifiche non lette`
                : 'Nessuna notifica non letta'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['all', 'Tutte'],
          ['unread', 'Non lette'],
          ['read', 'Lette'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error || actionError}
        </p>
      )}

      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4">
          {success}
        </p>
      )}

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Caricamento notifiche...</p>
        ) : notifications.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nessuna notifica da mostrare.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 ${notification.isRead ? 'bg-white' : 'bg-indigo-50/60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                          Nuova
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(notification.createdAt).toLocaleString('it-IT')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors"
                        title="Segna come letta"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
