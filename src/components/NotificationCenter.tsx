import { useState } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function NotificationCenter() {
  const { notifications, markNotificationRead, deleteNotification } = useApp()
  const [open, setOpen] = useState(false)

  const unread = notifications.filter((notification) => !notification.read).length

  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm hover:text-indigo-600 hover:border-indigo-200 transition-colors"
        title="Centro notifiche"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,22rem)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Notifiche</h2>
              <p className="text-xs text-slate-500">{unread} non lette</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-slate-500 text-center">
                Nessuna notifica
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${notification.read ? 'bg-white' : 'bg-amber-50/60'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString('it-IT')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationRead(notification.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Segna come letta"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Elimina notifica"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
