import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { v4 as uuid } from 'uuid'
import { seedData } from '../data/seed'
import type {
  AppState,
  Task,
  TaskPriority,
  TaskStatus,
  TeamMember,
  Notification,
} from '../types'
import { MEMBER_COLORS } from '../types'

const STORAGE_KEY = 'teamflow-data'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* ignore corrupt data */
  }
  return seedData
}

function persist(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

interface AppContextValue extends AppState {
  isServerConnected: boolean
  notifications: Notification[]
  selectedTask: Task | null
  isModalOpen: boolean
  defaultStatus: TaskStatus
  openModal: (task?: Task | null, defaultStatus?: TaskStatus) => void
  closeModal: () => void
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  addMember: (member: Omit<TeamMember, 'id' | 'color'>) => void
  updateMember: (id: string, updates: Partial<TeamMember>) => void
  deleteMember: (id: string) => void
  resetData: () => void
  getMember: (id: string | null) => TeamMember | undefined
  tasksByStatus: (status: TaskStatus) => Task[]
  overdueTasks: Task[]
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  clearNotifications: () => void
  stats: {
    total: number
    done: number
    inProgress: number
    overdue: number
    completedOnTime: number
    completedLate: number
    inReview: number
    todo: number
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const [isServerConnected, setIsServerConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const raw = localStorage.getItem('teamflow-notifications')
      return raw ? JSON.parse(raw) as Notification[] : []
    } catch {
      return []
    }
  })

  // Stati per il controllo globale di TaskModal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')

  const openModal = useCallback((task?: Task | null, status?: TaskStatus) => {
    setSelectedTask(task || null)
    setDefaultStatus(status || (task ? task.status : 'todo'))
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }, [])

  const commit = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev)
      persist(next)
      return next
    })
  }, [])

  // Caricamento iniziale e controllo connessione backend
  useEffect(() => {
    async function initConnection() {
      try {
        const resTasks = await fetch('/api/tasks')
        if (resTasks.ok) {
          const tasksData = await resTasks.json() as Task[]
          const resMembers = await fetch('/api/members')
          const membersData = resMembers.ok ? await resMembers.json() as TeamMember[] : state.members
          const resNotifs = await fetch('/api/notifications')
          const notifsData = resNotifs.ok ? await resNotifs.json() as Notification[] : []
          
          setState({ tasks: tasksData, members: membersData })
          setNotifications(notifsData)
          setIsServerConnected(true)

          // Richiedi il permesso delle notifiche browser
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (window.Notification.permission === 'default') {
              window.Notification.requestPermission()
            }
          }
        }
      } catch (err) {
        console.log('Server offline, uso localStorage come fallback.', err)
        setIsServerConnected(false)
      }
    }
    initConnection()
  }, [])

  // Connessione SSE per aggiornamenti in tempo reale
  useEffect(() => {
    if (!isServerConnected) return

    const eventSource = new EventSource('/api/notifications/stream')

    eventSource.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data) as Notification
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === notif.id)
          if (exists) return prev
          
          // Trigger della notifica nativa del browser
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            window.Notification.permission === 'granted'
          ) {
            new window.Notification(notif.taskTitle, {
              body: notif.message,
            })
          }

          return [notif, ...prev]
        })

        // Ricarichiamo i task per sincronizzare il campo reminderSent
        fetch('/api/tasks')
          .then((r) => r.json())
          .then((data) => {
            setState((prev) => ({ ...prev, tasks: data }))
          })
      } catch (err) {
        console.error('Errore nel parsing dell\'evento SSE:', err)
      }
    }

    eventSource.onerror = () => {
      console.log('Connessione SSE persa o server non in ascolto.')
    }

    return () => {
      eventSource.close()
    }
  }, [isServerConnected])

  // Scheduler locale per promemoria offline (quando il server non è connesso)
  useEffect(() => {
    if (isServerConnected) return

    const timer = setInterval(() => {
      const now = new Date()
      let updated = false
      const newNotifs: Notification[] = []

      const updatedTasks = state.tasks.map((task) => {
        if (task.status !== 'done' && task.reminderDate && !task.reminderSent) {
          const reminderTime = new Date(task.reminderDate)
          if (now >= reminderTime) {
            let message = 'Promemoria task in scadenza!'
            if (task.dueDate) {
              const due = new Date(task.dueDate)
              const diffMs = due.getTime() - reminderTime.getTime()
              const diffMin = Math.round(diffMs / (60 * 1000))
              if (diffMin === 5) message = 'Scade tra 5 minuti!'
              else if (diffMin === 30) message = 'Scade tra 30 minuti!'
              else if (diffMin === 60) message = 'Scade tra 1 ora!'
              else if (diffMin === 24 * 60) message = 'Scade tra 1 giorno!'
              else message = `Scadenza: ${new Date(task.dueDate).toLocaleString('it-IT')}`
            }

            // Prefisso urgente per task con priorità 'urgent'
            const isUrgent = task.priority === 'urgent'
            if (isUrgent) {
              message = `⚠️ TASK URGENTE IN SCADENZA — ${message}`
            }

            const notif: Notification = {
              id: uuid(),
              taskId: task.id,
              taskTitle: task.title,
              message,
              type: isUrgent ? 'urgent' : 'reminder',
              createdAt: now.toISOString(),
              read: false,
            }

            newNotifs.push(notif)
            updated = true
            return { ...task, reminderSent: true }
          }
        }
        return task
      })

      if (updated) {
        commit((prev) => ({ ...prev, tasks: updatedTasks }))
        setNotifications((prev) => {
          const next = [...newNotifs, ...prev].slice(0, 100)
          localStorage.setItem('teamflow-notifications', JSON.stringify(next))

          // Trigger notifica browser locale
          newNotifs.forEach((notif) => {
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              window.Notification.permission === 'granted'
            ) {
              new window.Notification(notif.taskTitle, {
                body: notif.message,
              })
            }
          })

          return next
        })
      }
    }, 10000) // Controlla ogni 10 secondi

    return () => clearInterval(timer)
  }, [isServerConnected, state.tasks, commit])

  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      if (isServerConnected) {
        try {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, reminderSent: false }),
          })
          if (res.ok) {
            const data = await res.json() as Task
            setState((prev) => ({ ...prev, tasks: [...prev.tasks, data] }))
            return
          }
        } catch (err) {
          console.error('Errore salvataggio task sul server, ripiego in locale:', err)
        }
      }

      commit((prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          { ...task, id: uuid(), createdAt: now, updatedAt: now, reminderSent: false },
        ],
      }))
    },
    [commit, isServerConnected],
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (isServerConnected) {
        try {
          const res = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
          if (res.ok) {
            const data = await res.json() as Task
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === id ? data : t)),
            }))
            return
          }
        } catch (err) {
          console.error('Errore aggiornamento task sul server, ripiego in locale:', err)
        }
      }

      commit((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id === id) {
            const updated = { ...t, ...updates, updatedAt: new Date().toISOString() }
            if (updates.reminderDate !== t.reminderDate) {
              updated.reminderSent = false
            }

            // Rilevamento transizione a 'done': generiamo notifica di completamento locale
            if (t.status !== 'done' && updates.status === 'done') {
              const completionNotif: Notification = {
                id: uuid(),
                taskId: t.id,
                taskTitle: t.title,
                message: '✅ Task completato con successo!',
                type: 'completion',
                createdAt: new Date().toISOString(),
                read: false,
              }
              setNotifications((prev) => {
                const next = [completionNotif, ...prev].slice(0, 100)
                localStorage.setItem('teamflow-notifications', JSON.stringify(next))
                // Notifica browser nativa
                if (
                  typeof window !== 'undefined' &&
                  'Notification' in window &&
                  window.Notification.permission === 'granted'
                ) {
                  new window.Notification(`✅ ${t.title}`, {
                    body: 'Task completato con successo!',
                  })
                }
                return next
              })
            }

            return updated
          }
          return t
        }),
      }))
    },
    [commit, isServerConnected],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      if (isServerConnected) {
        try {
          const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
          if (res.ok) {
            setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
            return
          }
        } catch (err) {
          console.error('Errore rimozione task dal server:', err)
        }
      }

      commit((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }))
    },
    [commit, isServerConnected],
  )

  const moveTask = useCallback(
    (id: string, status: TaskStatus) => {
      updateTask(id, { status })
    },
    [updateTask],
  )

  const addMember = useCallback(
    async (member: Omit<TeamMember, 'id' | 'color'>) => {
      if (isServerConnected) {
        try {
          const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...member,
              color: MEMBER_COLORS[state.members.length % MEMBER_COLORS.length],
            }),
          })
          if (res.ok) {
            const data = await res.json() as TeamMember
            setState((prev) => ({ ...prev, members: [...prev.members, data] }))
            return
          }
        } catch (err) {
          console.error('Errore inserimento membro sul server:', err)
        }
      }

      commit((prev) => ({
        ...prev,
        members: [
          ...prev.members,
          {
            ...member,
            id: uuid(),
            color: MEMBER_COLORS[prev.members.length % MEMBER_COLORS.length],
          },
        ],
      }))
    },
    [commit, isServerConnected, state.members.length],
  )

  const updateMember = useCallback(
    async (id: string, updates: Partial<TeamMember>) => {
      if (isServerConnected) {
        try {
          const res = await fetch(`/api/members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
          if (res.ok) {
            const data = await res.json() as TeamMember
            setState((prev) => ({
              ...prev,
              members: prev.members.map((m) => (m.id === id ? data : m)),
            }))
            return
          }
        } catch (err) {
          console.error('Errore aggiornamento membro sul server:', err)
        }
      }

      commit((prev) => ({
        ...prev,
        members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      }))
    },
    [commit, isServerConnected],
  )

  const deleteMember = useCallback(
    async (id: string) => {
      if (isServerConnected) {
        try {
          const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
          if (res.ok) {
            setState((prev) => ({
              ...prev,
              members: prev.members.filter((m) => m.id !== id),
              tasks: prev.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)),
            }))
            return
          }
        } catch (err) {
          console.error('Errore eliminazione membro dal server:', err)
        }
      }

      commit((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
        tasks: prev.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)),
      }))
    },
    [commit, isServerConnected],
  )

  const markNotificationAsRead = useCallback(
    async (id: string) => {
      if (isServerConnected) {
        try {
          await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        } catch (err) {
          console.error(err)
        }
      }
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        if (!isServerConnected) {
          localStorage.setItem('teamflow-notifications', JSON.stringify(next))
        }
        return next
      })
    },
    [isServerConnected],
  )

  const markAllNotificationsAsRead = useCallback(async () => {
    if (isServerConnected) {
      try {
        await fetch('/api/notifications/read-all', { method: 'POST' })
      } catch (err) {
        console.error(err)
      }
    }
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      if (!isServerConnected) {
        localStorage.setItem('teamflow-notifications', JSON.stringify(next))
      }
      return next
    })
  }, [isServerConnected])

  const clearNotifications = useCallback(async () => {
    if (isServerConnected) {
      try {
        await fetch('/api/notifications/clear', { method: 'POST' })
      } catch (err) {
        console.error(err)
      }
    }
    setNotifications([])
    if (!isServerConnected) {
      localStorage.removeItem('teamflow-notifications')
    }
  }, [isServerConnected])

  const resetData = useCallback(() => {
    persist(seedData)
    setState(seedData)
    setNotifications([])
    localStorage.removeItem('teamflow-notifications')
  }, [])

  const getMember = useCallback(
    (id: string | null) =>
      id ? state.members.find((m) => m.id === id) : undefined,
    [state.members],
  )

  const tasksByStatus = useCallback(
    (status: TaskStatus) => state.tasks.filter((t) => t.status === status),
    [state.tasks],
  )

  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return state.tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < today &&
        t.status !== 'done',
    )
  }, [state.tasks])

  const stats = useMemo(
    () => ({
      total: state.tasks.length,
      done: state.tasks.filter((t) => t.status === 'done').length,
      inProgress: state.tasks.filter((t) => t.status === 'in_progress').length,
      overdue: overdueTasks.length,
      completedOnTime: state.tasks.filter(
        (t) =>
          t.status === 'done' &&
          (!t.dueDate || t.updatedAt.slice(0, 10) <= t.dueDate),
      ).length,
      completedLate: state.tasks.filter(
        (t) =>
          t.status === 'done' &&
          !!t.dueDate &&
          t.updatedAt.slice(0, 10) > t.dueDate,
      ).length,
      inReview: state.tasks.filter((t) => t.status === 'review').length,
      todo: state.tasks.filter((t) => t.status === 'todo').length,
    }),
    [state.tasks, overdueTasks],
  )

  const value = useMemo(
    () => ({
      ...state,
      isServerConnected,
      notifications,
      selectedTask,
      isModalOpen,
      defaultStatus,
      openModal,
      closeModal,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      addMember,
      updateMember,
      deleteMember,
      resetData,
      getMember,
      tasksByStatus,
      overdueTasks,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      stats,
    }),
    [
      state,
      isServerConnected,
      notifications,
      selectedTask,
      isModalOpen,
      defaultStatus,
      openModal,
      closeModal,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      addMember,
      updateMember,
      deleteMember,
      resetData,
      getMember,
      tasksByStatus,
      overdueTasks,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      stats,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { TaskPriority, TaskStatus }
