import { useMemo, useState } from 'react'
import { Bell, Clock3, Sparkles, Trash2, X } from 'lucide-react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext'

export function Layout() {
  const navigate = useNavigate()
  const { notifications, deleteNotification, markNotificationRead, tasks } = useApp()
  const [showNotifications, setShowNotifications] = useState(false)

  const unreadCount = notifications.filter((item) => !item.read).length

  const nextDueTask = useMemo(() => {
    const upcoming = tasks
      .filter((task) => task.status !== 'done' && task.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

    return upcoming[0] ?? null
  }, [tasks])

  const countdownText = useMemo(() => {
    if (!nextDueTask?.dueDate) return null

    const now = new Date()
    const due = new Date(nextDueTask.dueDate)
    const diffMs = due.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffMs < 0) return 'Scaduto'
    if (diffDays > 0) return `${diffDays}g ${diffHours}h`
    if (diffHours > 0) return `${diffHours}h`
    return 'Oggi'
  }, [nextDueTask])

  const openTask = (taskId: string) => {
    markNotificationRead(taskId)
    setShowNotifications(false)
    navigate(`/board?taskId=${taskId}`)
  }

  return (
    <div className="relative flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white/90 border-r border-slate-200 min-h-screen p-4 backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">TeamFlow</h1>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((value) => !value)}
              className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed right-3 top-3 z-[60] w-[min(92vw,24rem)] max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:right-4 sm:w-[22rem]">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Notifiche</p>
                    <p className="text-xs text-slate-500">I reminder più recenti appaiono qui</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                    Nessuna notifica al momento.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 transition hover:border-indigo-200 hover:bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openTask(notification.taskId)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                              <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNotification(notification.id)}
                            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink to="/" className="menu-item">Dashboard</NavLink>
          <NavLink to="/board" className="menu-item">Board</NavLink>
          <NavLink to="/team" className="menu-item">Team</NavLink>
          <NavLink to="/calendar" className="menu-item">📅 Calendar</NavLink>
          <NavLink to="/gestione_stato" className="menu-item">Gestione Stato</NavLink>
          <NavLink to="/categories" className="menu-item">Categorie</NavLink>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {nextDueTask && (
        <button
          type="button"
          onClick={() => navigate(`/board?taskId=${nextDueTask.id}`)}
          className="fixed bottom-4 right-4 z-30 flex max-w-[min(92vw,24rem)] items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
            <Clock3 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-slate-800">{nextDueTask.title}</p>
            <p className="text-xs text-slate-500">Next due · {countdownText}</p>
          </div>
        </button>
      )}
    </div>
  )
}