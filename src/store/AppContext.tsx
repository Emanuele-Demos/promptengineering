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
  AppState,
  Category,
  Folder,
  Goal,
  GoalHistoryEntry,
  GoalProgress,
  Notification,
  Task,
  TaskPriority,
  TaskStatus,
  TeamMember,
} from '../types'
import { MEMBER_COLORS } from '../types'

const API_BASE = 'http://localhost:3001/api'

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
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  resetData: () => void
  fetchNotifications: () => Promise<void>
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  deleteNotification: (id: string) => void
  loadGoals: () => Promise<void>
  createGoal: (payload: { type: 'daily' | 'weekly'; target: number }) => Promise<void>
  updateGoal: (id: string, target: number, type?: 'daily' | 'weekly') => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  getMember: (id: string | null) => TeamMember | undefined
  getCategory: (id: string | null) => Category | undefined
  tasksByStatus: (status: TaskStatus) => Task[]
  overdueTasks: Task[]
  notifications: Notification[]
  goals: Goal[]
  goalsProgress: GoalProgress[]
  goalHistory: GoalHistoryEntry[]
  statistics: {
    completedToday: number
    completedWeek: number
    completedMonth: number
    overdueTasks: number
    openTasks: number
    averageCompletionTime: number
    weeklyTrend: Array<{ day: string; completed: number }>
    monthlyCompletions: Array<{ month: string; completed: number }>
    tasksByCategory: Array<{ category: string; count: number }>
    tasksByPriority: Array<{ priority: string; count: number }>
  } | null
  unreadNotifications: number
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    tasks: [],
    members: [],
    folders: [],
    categories: [],
    notifications: [],
    goals: [],
    goalsProgress: [],
    goalHistory: [],
    statistics: null,
  })
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`)
      const data = await res.json()
      setState((prev) => ({ ...prev, notifications: data }))
    } catch (err) {
      console.error('Errore nel caricamento delle notifiche:', err)
    }
  }, [])

  const loadGoals = useCallback(async () => {
    try {
      const [resGoals, resProgress, resHistory] = await Promise.all([
        fetch(`${API_BASE}/goals`).then((r) => r.json()),
        fetch(`${API_BASE}/goals/current`).then((r) => r.json()),
        fetch(`${API_BASE}/goals/history`).then((r) => r.json()),
      ])

      setState((prev) => ({
        ...prev,
        goals: resGoals,
        goalsProgress: Array.isArray(resProgress) ? resProgress : [],
        goalHistory: Array.isArray(resHistory) ? resHistory : [],
      }))
    } catch (err) {
      console.error('Errore nel caricamento degli obiettivi:', err)
    }
  }, [])

  const loadStatistics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/statistics`)
      const data = await res.json()
      setState((prev) => ({ ...prev, statistics: data }))
    } catch (err) {
      console.error('Errore nel caricamento delle statistiche:', err)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [resTasks, resMembers, resFolders, resCategories, resNotifications] = await Promise.all([
          fetch(`${API_BASE}/tasks`).then((r) => r.json()),
          fetch(`${API_BASE}/members`).then((r) => r.json()),
          fetch(`${API_BASE}/folders`).then((r) => r.json()),
          fetch(`${API_BASE}/categories`).then((r) => r.json()),
          fetch(`${API_BASE}/notifications`).then((r) => r.json()),
        ])

        const normalizedTasks = (resTasks as Task[]).map((task) => ({
          ...task,
          notes: task.notes ?? '',
          links: task.links ?? [],
          attachments: task.attachments ?? [],
        }))

        setState((prev) => ({
          ...prev,
          tasks: normalizedTasks,
          members: resMembers,
          folders: resFolders,
          categories: resCategories,
          notifications: resNotifications,
        }))
      } catch (err) {
        console.error('Errore nel caricamento dei dati dal server:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
    void loadGoals()
    void loadStatistics()
    const interval = window.setInterval(() => {
      void fetchNotifications()
      void loadGoals()
      void loadStatistics()
    }, 60000)

    return () => window.clearInterval(interval)
  }, [fetchNotifications, loadGoals, loadStatistics])

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newTask: Task = {
      id: uuid(),
      createdAt: now,
      updatedAt: now,
      title: task.title,
      description: task.description,
      notes: task.notes ?? '',
      links: task.links ?? [],
      attachments: task.attachments ?? [],
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      folderId: task.folderId,
      categoryId: task.categoryId,
      dueDate: task.dueDate,
      tags: task.tags,
      reminderDate: task.reminderDate ?? null,
      reminderType: task.reminderType ?? 'none',
      notificationSent: task.notificationSent ?? false,
    }

    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }))

    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    })
      .catch((err) => console.error('Errore durante la creazione del task:', err))
      .finally(() => {
        void loadStatistics()
      })
  }, [loadStatistics])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const now = new Date().toISOString()
    const taskUpdates = { ...updates, updatedAt: now }

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...taskUpdates } : t)),
    }))

    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskUpdates),
    })
      .catch((err) => console.error("Errore durante l'aggiornamento del task:", err))
      .finally(() => {
        void loadGoals()
        void loadStatistics()
      })
  }, [loadGoals, loadStatistics])

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }))

    fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione del task:", err))
      .finally(() => {
        void loadStatistics()
      })
  }, [loadStatistics])

  const moveTask = useCallback((id: string, status: TaskStatus) => {
    updateTask(id, { status })
  }, [updateTask])

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

  const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt'>) => {
    const newId = uuid()
    const createdAt = new Date().toISOString()
    const newCategory = { ...category, id: newId, createdAt }

    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))

    fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory),
    })
      .catch((err) => console.error('Errore durante la creazione della categoria:', err))
      .finally(() => {
        void loadStatistics()
      })
  }, [loadStatistics])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((category) => (category.id === id ? { ...category, ...updates } : category)),
    }))

    fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.error("Errore durante l'aggiornamento della categoria:", err))
      .finally(() => {
        void loadStatistics()
      })
  }, [loadStatistics])

  const deleteCategory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== id),
      tasks: prev.tasks.map((task) => (task.categoryId === id ? { ...task, categoryId: null } : task)),
    }))

    fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione della categoria:", err))
      .finally(() => {
        void loadStatistics()
      })
  }, [loadStatistics])

  const resetData = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' })
      const [resTasks, resMembers, resFolders, resCategories, resNotifications] = await Promise.all([
        fetch(`${API_BASE}/tasks`).then((r) => r.json()),
        fetch(`${API_BASE}/members`).then((r) => r.json()),
        fetch(`${API_BASE}/folders`).then((r) => r.json()),
        fetch(`${API_BASE}/categories`).then((r) => r.json()),
        fetch(`${API_BASE}/notifications`).then((r) => r.json()),
      ])
      setState({
        tasks: resTasks,
        members: resMembers,
        folders: resFolders,
        categories: resCategories,
        notifications: resNotifications,
        goals: [],
        goalsProgress: [],
        goalHistory: [],
        statistics: null,
      })
      void loadStatistics()
    } catch (err) {
      console.error('Errore durante il reset dei dati:', err)
    }
  }, [])

  const markNotificationAsRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    }))

    fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' }).catch((err) => console.error('Errore nel marcare la notifica come letta:', err))
  }, [])

  const markAllNotificationsAsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) => ({ ...notification, read: true })),
    }))

    fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' }).catch((err) => console.error('Errore nel marcare tutte le notifiche come lette:', err))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((notification) => notification.id !== id),
    }))

    fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' }).catch((err) => console.error('Errore nell\'eliminazione della notifica:', err))
  }, [])

  const createGoal = useCallback(async (payload: { type: 'daily' | 'weekly'; target: number }) => {
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Impossibile creare l\'obiettivo')
      await loadGoals()
    } catch (err) {
      console.error('Errore nella creazione dell\'obiettivo:', err)
    }
  }, [loadGoals])

  const updateGoal = useCallback(async (id: string, target: number, type: 'daily' | 'weekly' = 'daily') => {
    try {
      const res = await fetch(`${API_BASE}/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, type }),
      })
      if (!res.ok) throw new Error('Impossibile aggiornare l\'obiettivo')
      await loadGoals()
    } catch (err) {
      console.error('Errore nell\'aggiornamento dell\'obiettivo:', err)
    }
  }, [loadGoals])

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Impossibile eliminare l\'obiettivo')
      await loadGoals()
    } catch (err) {
      console.error('Errore nell\'eliminazione dell\'obiettivo:', err)
    }
  }, [loadGoals])

  const getMember = useCallback(
    (id: string | null) => (id ? state.members.find((m) => m.id === id) : undefined),
    [state.members],
  )

  const getCategory = useCallback(
    (id: string | null) => (id ? state.categories.find((category) => category.id === id) : undefined),
    [state.categories],
  )

  const tasksByStatus = useCallback(
    (status: TaskStatus) => state.tasks.filter((t) => t.status === status),
    [state.tasks],
  )

  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return state.tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'done')
  }, [state.tasks])

  const unreadNotifications = useMemo(() => state.notifications.filter((notification) => !notification.read).length, [state.notifications])

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
      resetData,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      loadGoals,
      createGoal,
      updateGoal,
      deleteGoal,
      loadStatistics,
      getMember,
      getCategory,
      tasksByStatus,
      overdueTasks,
      notifications: state.notifications,
      unreadNotifications,
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
      resetData,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      loadGoals,
      createGoal,
      updateGoal,
      deleteGoal,
      loadStatistics,
      getMember,
      getCategory,
      tasksByStatus,
      overdueTasks,
      state.notifications,
      unreadNotifications,
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
