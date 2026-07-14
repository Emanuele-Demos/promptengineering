import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { v4 as uuid } from 'uuid'
import type {
  AppNotification,
  AppState,
  Task,
  TaskPriority,
  TaskStatus,
  TeamMember,
  Folder,
  Category,
  Goal,
} from '../types'
import { MEMBER_COLORS } from '../types'

const API_BASE = 'http://localhost:3001/api'
const STORAGE_KEYS = {
  notifications: 'teamflow-notifications',
  reminders: 'teamflow-task-reminders',
}

interface AppContextValue extends AppState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  addMember: (member: Omit<TeamMember, 'id' | 'color'>) => void
  updateMember: (id: string, updates: Partial<TeamMember>) => void
  deleteMember: (id: string) => void
  addFolder: (folder: Omit<Folder, 'id'>) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  deleteNotification: (id: string) => void
  clearNotifications: () => void
  resetData: () => void
  getMember: (id: string | null) => TeamMember | undefined
  tasksByStatus: (status: TaskStatus) => Task[]
  overdueTasks: Task[]
  loading: boolean
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

function readStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.notifications)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function readStoredReminders(): Record<string, string | null> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.reminders)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function buildNotification(task: Task): AppNotification {
  const reminderTarget = task.reminderAt || task.dueDate
  const message = reminderTarget
    ? `Promemoria attivo per ${task.title}`
    : `Nuovo task pronto per il follow-up`

  return {
    id: uuid(),
    taskId: task.id,
    title: task.title,
    message,
    scheduledAt: reminderTarget ?? new Date().toISOString(),
    read: false,
    createdAt: new Date().toISOString(),
  }
}

function persistReminders(tasks: Task[]) {
  if (typeof window === 'undefined') return
  const reminderMap = Object.fromEntries(
    tasks.filter((task) => task.reminderAt).map((task) => [task.id, task.reminderAt]),
  )
  window.localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(reminderMap))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    tasks: [],
    members: [],
    folders: [],
    categories: [],
    goals: [],
    notifications: readStoredNotifications(),
  }))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [resTasks, resMembers, resFolders, resCategories, resGoals] = await Promise.all([
          fetch(`${API_BASE}/tasks`).then((r) => r.json()),
          fetch(`${API_BASE}/members`).then((r) => r.json()),
          fetch(`${API_BASE}/folders`).then((r) => r.json()),
          fetch(`${API_BASE}/categories`).then((r) => r.json()),
          fetch(`${API_BASE}/goals`).then((r) => r.json()),
        ])

        const storedReminders = readStoredReminders()
        const normalizedTasks = (resTasks as Task[]).map((task) => ({
          ...task,
          notes: task.notes ?? '',
          links: task.links ?? [],
          attachments: task.attachments ?? [],
          reminderAt: storedReminders[task.id] ?? task.reminderAt ?? null,
          order: task.order ?? 0,
        }))

        const existingNotifications = readStoredNotifications()
        const notificationsWithTask = normalizedTasks.reduce<AppNotification[]>((acc, task) => {
          const alreadyExists = existingNotifications.some((notification) => notification.taskId === task.id)
          if (task.reminderAt && !alreadyExists) {
            acc.push(buildNotification(task))
          }
          return acc
        }, [...existingNotifications])

        setState((prev) => ({
          ...prev,
          tasks: normalizedTasks,
          members: resMembers,
          folders: resFolders,
          categories: resCategories,
          goals: resGoals,
          notifications: notificationsWithTask,
        }))
      } catch (err) {
        console.error('Errore nel caricamento dei dati dal server:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || loading) return
    window.localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(state.notifications))
    persistReminders(state.tasks)
  }, [loading, state.notifications, state.tasks])

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newTask: Task = {
      ...task,
      notes: task.notes ?? '',
      links: task.links ?? [],
      attachments: task.attachments ?? [],
      reminderAt: task.reminderAt ?? null,
      order: task.order ?? 0,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }

    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      notifications: newTask.reminderAt
        ? [...prev.notifications, buildNotification(newTask)]
        : prev.notifications,
    }))

    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    }).catch((err) => console.error('Errore durante la creazione del task:', err))
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const now = new Date().toISOString()
    const taskUpdates = { ...updates, updatedAt: now }

    setState((prev) => {
      const existingTask = prev.tasks.find((t) => t.id === id)
      const nextReminderAt = updates.reminderAt ?? existingTask?.reminderAt ?? null

      const notifications = nextReminderAt
        ? prev.notifications.some((notification) => notification.taskId === id)
          ? prev.notifications
          : [...prev.notifications, buildNotification({ ...(existingTask ?? ({} as Task)), ...taskUpdates, reminderAt: nextReminderAt, id })]
        : prev.notifications.filter((notification) => notification.taskId !== id)

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...taskUpdates, reminderAt: nextReminderAt } : t)),
        notifications,
      }
    })

    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskUpdates),
    }).catch((err) => console.error("Errore durante l'aggiornamento del task:", err))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      notifications: prev.notifications.filter((notification) => notification.taskId !== id),
    }))

    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione del task:", err))
  }, [])

  const moveTask = useCallback(
    (id: string, status: TaskStatus) => {
      updateTask(id, { status })
    },
    [updateTask],
  )

  const addMember = useCallback((member: Omit<TeamMember, 'id' | 'color'>) => {
    const newId = uuid()
    setState((prev) => {
      const color = MEMBER_COLORS[prev.members.length % MEMBER_COLORS.length]
      const newMember = { ...member, id: newId, color }

      fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      }).catch((err) => console.error("Errore durante l'aggiunta del membro:", err))

      return {
        ...prev,
        members: [...prev.members, newMember],
      }
    })
  }, [])

  const updateMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))

    fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.error("Errore durante l'aggiornamento del membro:", err))
  }, [])

  const deleteMember = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
      tasks: prev.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)),
    }))

    fetch(`${API_BASE}/members/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione del membro:", err))
  }, [])

  const addFolder = useCallback((folder: Omit<Folder, 'id'>) => {
    const newId = uuid()
    const newFolder = { ...folder, id: newId }

    setState((prev) => ({
      ...prev,
      folders: [...prev.folders, newFolder],
    }))

    fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFolder),
    }).catch((err) => console.error('Errore durante la creazione della cartella:', err))
  }, [])

  const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }))

    fetch(`${API_BASE}/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.error("Errore durante l'aggiornamento della cartella:", err))
  }, [])

  const deleteFolder = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== id),
      tasks: prev.tasks.map((t) => (t.folderId === id ? { ...t, folderId: null } : t)),
    }))

    fetch(`${API_BASE}/folders/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione della cartella:", err))
  }, [])

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newId = uuid()
    const newCategory = { ...category, id: newId }

    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))

    fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory),
    }).catch((err) => console.error('Errore durante la creazione della categoria:', err))
  }, [])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))

    fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.error("Errore durante l'aggiornamento della categoria:", err))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      tasks: prev.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
    }))

    fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione della categoria:", err))
  }, [])

  const createGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString()
    const newGoal: Goal = {
      ...goal,
      id: uuid(),
      createdAt: now,
    }

    setState((prev) => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
    }))

    fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGoal),
    }).catch((err) => console.error('Errore durante la creazione dell\'obiettivo:', err))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
    }))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((item) => item.id !== id),
    }))
  }, [])

  const clearNotifications = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }))
  }, [])

  const resetData = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' })
      const [resTasks, resMembers, resFolders, resCategories, resGoals] = await Promise.all([
        fetch(`${API_BASE}/tasks`).then((r) => r.json()),
        fetch(`${API_BASE}/members`).then((r) => r.json()),
        fetch(`${API_BASE}/folders`).then((r) => r.json()),
        fetch(`${API_BASE}/categories`).then((r) => r.json()),
        fetch(`${API_BASE}/goals`).then((r) => r.json()),
      ])
      setState({ tasks: resTasks, members: resMembers, folders: resFolders, categories: resCategories, goals: resGoals, notifications: [] })
    } catch (err) {
      console.error('Errore durante il reset dei dati:', err)
    }
  }, [])

  const getMember = useCallback(
    (id: string | null) => (id ? state.members.find((m) => m.id === id) : undefined),
    [state.members],
  )

  const tasksByStatus = useCallback(
    (status: TaskStatus) => state.tasks.filter((t) => t.status === status),
    [state.tasks],
  )

  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return state.tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'done')
  }, [state.tasks])

  const stats = useMemo(
    () => ({
      total: state.tasks.length,
      done: state.tasks.filter((t) => t.status === 'done').length,
      inProgress: state.tasks.filter((t) => t.status === 'in_progress').length,
      overdue: overdueTasks.length,
      completedOnTime: state.tasks.filter(
        (t) => t.status === 'done' && (!t.dueDate || t.updatedAt.slice(0, 10) <= t.dueDate),
      ).length,
      completedLate: state.tasks.filter(
        (t) => t.status === 'done' && !!t.dueDate && t.updatedAt.slice(0, 10) > t.dueDate,
      ).length,
      inReview: state.tasks.filter((t) => t.status === 'review').length,
      todo: state.tasks.filter((t) => t.status === 'todo').length,
    }),
    [state.tasks, overdueTasks],
  )

  const value = useMemo(
    () => ({
      ...state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      addMember,
      updateMember,
      deleteMember,
      addFolder,
      updateFolder,
      deleteFolder,
      addCategory,
      updateCategory,
      deleteCategory,
      createGoal,
      markNotificationRead,
      deleteNotification,
      clearNotifications,
      resetData,
      getMember,
      tasksByStatus,
      overdueTasks,
      loading,
      stats,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      addMember,
      updateMember,
      deleteMember,
      addFolder,
      updateFolder,
      deleteFolder,
      addCategory,
      updateCategory,
      deleteCategory,
      createGoal,
      markNotificationRead,
      deleteNotification,
      clearNotifications,
      resetData,
      getMember,
      tasksByStatus,
      overdueTasks,
      loading,
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
