import { useState } from 'react'
import { Bell, BellRing, X } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function NotificationCenter() {
  const { notifications, dismissNotification, clearNotifications } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        {notifications.length > 0 ? <BellRing className="w-4 h-4 text-amber-500" /> : <Bell className="w-4 h-4" />}
        <span>Notifiche</span>
        {notifications.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Centro notifiche</p>
            <button type="button" onClick={() => clearNotifications()} className="text-xs text-slate-500 hover:text-slate-700">
              Pulisci
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">Nessuna notifica al momento.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    </div>
                    <button type="button" onClick={() => dismissNotification(notification.id)} className="text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
