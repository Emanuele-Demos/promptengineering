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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({ tasks: [], members: [], folders: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [resTasks, resMembers, resFolders] = await Promise.all([
          fetch(`${API_BASE}/tasks`).then((r) => r.json()),
          fetch(`${API_BASE}/members`).then((r) => r.json()),
          fetch(`${API_BASE}/folders`).then((r) => r.json()),
        ])

        const normalizedTasks = (resTasks as Task[]).map((task) => ({
          ...task,
          notes: task.notes ?? '',
          links: task.links ?? [],
          attachments: task.attachments ?? [],
        }))

        setState({ tasks: normalizedTasks, members: resMembers, folders: resFolders })
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
      notes: '',
      links: [],
      attachments: [],
      ...task,
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
      body: JSON.stringify(newTask),
    }).catch((err) => console.error('Errore durante la creazione del task:', err))
  }, [])

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

  const resetData = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' })
      const [resTasks, resMembers, resFolders] = await Promise.all([
        fetch(`${API_BASE}/tasks`).then((r) => r.json()),
        fetch(`${API_BASE}/members`).then((r) => r.json()),
        fetch(`${API_BASE}/folders`).then((r) => r.json()),
      ])
      setState({ tasks: resTasks, members: resMembers, folders: resFolders })
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
