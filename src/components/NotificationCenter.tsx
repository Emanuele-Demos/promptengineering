import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2, Wifi, WifiOff, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useApp } from '../store/AppContext'

interface NotificationBellProps {
  align?: 'left' | 'right' | 'sidebar'
}

export function NotificationBell({ align = 'right' }: NotificationBellProps) {
  const {
    notifications,
    isServerConnected,
    tasks,
    openModal,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useApp()

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Chiudi il centro notifiche al click esterno
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNotificationClick = (notification: any) => {
    markNotificationAsRead(notification.id)
    setIsOpen(false)
    
    // Trova il task corrispondente e aprilo nel modal globale
    const task = tasks.find((t) => t.id === notification.taskId)
    if (task) {
      openModal(task)
    }
  }

  // Definisce il posizionamento del menu a comparsa
  let dropdownClass = 'absolute mt-2 w-80 bg-white/95 backdrop-blur border border-slate-200 shadow-2xl rounded-2xl z-50 flex flex-col '
  if (align === 'right') {
    dropdownClass += 'right-0 top-full origin-top-right'
  } else if (align === 'left') {
    dropdownClass += 'left-0 top-full origin-top-left'
  } else {
    // Posizionamento per la Sidebar (sopra o di fianco)
    dropdownClass += 'left-4 bottom-14 w-72 origin-bottom-left'
  }

  // Helper per ottenere lo stile in base al tipo di notifica
  function getNotifStyle(notif: any) {
    const type = notif.type
    if (type === 'urgent') {
      return {
        row: `p-3.5 cursor-pointer transition-colors flex gap-2.5 items-start border-l-4 border-red-400 ${!notif.read ? 'bg-red-50' : 'bg-white hover:bg-red-50/50'}`,
        dot: !notif.read ? 'bg-red-500' : 'bg-transparent',
        icon: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
        titleColor: 'text-red-800',
        msgColor: 'text-red-600',
      }
    }
    if (type === 'completion') {
      return {
        row: `p-3.5 cursor-pointer transition-colors flex gap-2.5 items-start border-l-4 border-emerald-400 ${!notif.read ? 'bg-emerald-50' : 'bg-white hover:bg-emerald-50/50'}`,
        dot: !notif.read ? 'bg-emerald-500' : 'bg-transparent',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
        titleColor: 'text-emerald-800',
        msgColor: 'text-emerald-600',
      }
    }
    // reminder (default)
    return {
      row: `p-3.5 cursor-pointer hover:bg-slate-50 transition-colors flex gap-2.5 items-start ${!notif.read ? 'bg-indigo-50/20' : ''}`,
      dot: !notif.read ? 'bg-indigo-600' : 'bg-transparent',
      icon: <Bell className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />,
      titleColor: 'text-slate-800',
      msgColor: 'text-slate-500',
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Icona Campanella */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        title="Notifiche"
      >
        <Bell className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'scale-105' : 'group-hover:rotate-12'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Pannello Centro Notifiche */}
      {isOpen && (
        <div className={`${dropdownClass} animate-in fade-in slide-in-from-top-3 duration-200`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Notifiche</h3>
              <p className="text-[10px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} da leggere` : 'Nessun nuovo avviso'}
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                  title="Segna tutte come lette"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => clearNotifications()}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                  title="Pulisci tutte"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Elenco Notifiche */}
          <div className="overflow-y-auto max-h-72 divide-y divide-slate-100 py-1 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-medium text-slate-500">Nessuna notifica</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ti avviseremo prima delle scadenze dei tuoi task.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const style = getNotifStyle(notif)
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={style.row}
                  >
                    {/* Icona tipo */}
                    {style.icon}

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate mb-0.5 ${style.titleColor}`}>
                        {notif.taskTitle}
                      </p>
                      <p className={`text-[11px] leading-snug ${style.msgColor}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(notif.createdAt).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {!notif.read && (
                          <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${style.dot}`} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Legenda tipi notifica */}
          {notifications.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/30 flex items-center gap-3 text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Completato
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Urgente
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                Promemoria
              </span>
            </div>
          )}

          {/* Footer - Connettività */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between text-[10px] font-medium text-slate-500">
            {isServerConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                Server Connesso (SSE)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600">
                <WifiOff className="w-3.5 h-3.5" />
                Modalità Locale (Offline)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
