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
  Task,
  TaskPriority,
  TaskStatus,
  TeamMember,
  Folder,
  Category,
  AppNotification,
} from '../types'
import { MEMBER_COLORS } from '../types'

const API_BASE = 'http://localhost:3001/api'

function taskPayload(task: Partial<Task>) {
  const payload = { ...task }
  delete payload.attachments
  return payload
}

interface AppContextValue extends AppState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  uploadTaskAttachments: (taskId: string, files: File[]) => Promise<void>
  deleteAttachment: (taskId: string, attachmentId: string) => void
  addMember: (member: Omit<TeamMember, 'id' | 'color'>) => void
  updateMember: (id: string, updates: Partial<TeamMember>) => void
  deleteMember: (id: string) => void
  addFolder: (folder: Omit<Folder, 'id'>) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  refreshNotifications: () => Promise<void>
  markNotificationRead: (id: string) => void
  deleteNotification: (id: string) => void
  resetData: () => void
  getMember: (id: string | null) => TeamMember | undefined
  getCategory: (id: string | null | undefined) => Category | undefined
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({ tasks: [], members: [], folders: [], categories: [], notifications: [] })
  const [loading, setLoading] = useState(true)

  const refreshNotifications = useCallback(async () => {
    try {
      const notifications = await fetch(`${API_BASE}/notifications`).then((r) => r.json())
      setState((prev) => ({ ...prev, notifications: notifications as AppNotification[] }))
    } catch (err) {
      console.error('Errore durante il caricamento delle notifiche:', err)
    }
  }, [])

  const uploadTaskAttachments = useCallback(async (taskId: string, files: File[]) => {
    if (files.length === 0) return

    const formData = new FormData()
    files.forEach((file) => formData.append('attachments', file))

    try {
      const uploaded = await fetch(`${API_BASE}/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData,
      }).then((r) => {
        if (!r.ok) throw new Error('Upload allegati non riuscito')
        return r.json()
      })

      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === taskId
            ? { ...task, attachments: [...(task.attachments ?? []), ...uploaded] }
            : task,
        ),
      }))
    } catch (err) {
      console.error("Errore durante l'upload degli allegati:", err)
    }
  }, [])

  const deleteAttachment = useCallback((taskId: string, attachmentId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? { ...task, attachments: task.attachments.filter((attachment) => attachment.id !== attachmentId) }
          : task,
      ),
    }))

    fetch(`${API_BASE}/attachments/${attachmentId}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione dell'allegato:", err))
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

        setState({ tasks: normalizedTasks, members: resMembers, folders: resFolders, categories: resCategories, notifications: resNotifications })
      } catch (err) {
        console.error('Errore nel caricamento dei dati dal server:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newTask: Task = {
      ...task,
      notes: task.notes ?? '',
      links: task.links ?? [],
      attachments: task.attachments ?? [],
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    }

    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }))

    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskPayload(newTask)),
    })
      .then(() => uploadTaskAttachments(newTask.id, newTask.attachments.flatMap((attachment) => attachment.file ? [attachment.file] : [])))
      .catch((err) => console.error('Errore durante la creazione del task:', err))
  }, [uploadTaskAttachments])

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
      body: JSON.stringify(taskPayload(taskUpdates)),
    }).catch((err) => console.error("Errore durante l'aggiornamento del task:", err))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
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

  useEffect(() => {
    const interval = window.setInterval(refreshNotifications, 30000)
    return () => window.clearInterval(interval)
  }, [refreshNotifications])

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: uuid() }

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

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))

    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
    }).catch((err) => console.error("Errore durante l'aggiornamento della notifica:", err))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }))

    fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
    }).catch((err) => console.error("Errore durante l'eliminazione della notifica:", err))
  }, [])

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
      setState({ tasks: resTasks, members: resMembers, folders: resFolders, categories: resCategories, notifications: resNotifications })
    } catch (err) {
      console.error('Errore durante il reset dei dati:', err)
    }
  }, [])

  const getMember = useCallback(
    (id: string | null) => (id ? state.members.find((m) => m.id === id) : undefined),
    [state.members],
  )

  const getCategory = useCallback(
    (id: string | null | undefined) => (id ? state.categories.find((c) => c.id === id) : undefined),
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
      uploadTaskAttachments,
      deleteAttachment,
      addMember,
      updateMember,
      deleteMember,
      addFolder,
      updateFolder,
      deleteFolder,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshNotifications,
      markNotificationRead,
      deleteNotification,
      resetData,
      getMember,
      getCategory,
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
      uploadTaskAttachments,
      deleteAttachment,
      addMember,
      updateMember,
      deleteMember,
      addFolder,
      updateFolder,
      deleteFolder,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshNotifications,
      markNotificationRead,
      deleteNotification,
      resetData,
      getMember,
      getCategory,
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
