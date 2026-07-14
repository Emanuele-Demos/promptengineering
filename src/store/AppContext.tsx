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
import { seedData } from '../data/seed'
import type {
  AppNotification,
  AppState,
  Category,
  Goal,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  TeamMember,
} from '../types'
import { MEMBER_COLORS } from '../types'

const STORAGE_KEY = 'teamflow-data'

function normalizeState(raw: Partial<AppState> | null | undefined): AppState {
  if (!raw) return seedData
  return {
    members: raw.members ?? seedData.members,
    tasks: raw.tasks ?? seedData.tasks,
    categories: raw.categories ?? seedData.categories,
    projects: raw.projects ?? seedData.projects,
    goals: raw.goals ?? seedData.goals,
    notifications: raw.notifications ?? seedData.notifications,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeState(JSON.parse(raw) as Partial<AppState>)
  } catch {
    /* ignore corrupt data */
  }
  return seedData
}

function persist(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

interface AppContextValue extends AppState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  archiveTask: (id: string) => void
  restoreTask: (id: string) => void
  addMember: (member: Omit<TeamMember, 'id' | 'color'>) => void
  updateMember: (id: string, updates: Partial<TeamMember>) => void
  deleteMember: (id: string) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  addProject: (project: Omit<Project, 'id'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
  resetData: () => void
  getMember: (id: string | null) => TeamMember | undefined
  getCategory: (id: string | null) => Category | undefined
  getProject: (id: string | null) => Project | undefined
  tasksByStatus: (status: TaskStatus) => Task[]
  overdueTasks: Task[]
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

  const commit = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev)
      persist(next)
      return next
    })
  }, [])

  const addTask = useCallback(
    (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      commit((prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          { ...task, favorite: task.favorite ?? false, archived: task.archived ?? false, id: uuid(), createdAt: now, updatedAt: now },
        ],
      }))
    },
    [commit],
  )

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      commit((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id
            ? { ...t, ...updates, updatedAt: new Date().toISOString() }
            : t,
        ),
      }))
    },
    [commit],
  )

  const deleteTask = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }))
    },
    [commit],
  )

  const moveTask = useCallback(
    (id: string, status: TaskStatus) => {
      updateTask(id, { status })
    },
    [updateTask],
  )

  const archiveTask = useCallback(
    (id: string) => {
      updateTask(id, { archived: true, status: 'done' })
    },
    [updateTask],
  )

  const restoreTask = useCallback(
    (id: string) => {
      updateTask(id, { archived: false })
    },
    [updateTask],
  )

  const addMember = useCallback(
    (member: Omit<TeamMember, 'id' | 'color'>) => {
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
    [commit],
  )

  const updateMember = useCallback(
    (id: string, updates: Partial<TeamMember>) => {
      commit((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === id ? { ...m, ...updates } : m,
        ),
      }))
    },
    [commit],
  )

  const deleteMember = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
        tasks: prev.tasks.map((t) =>
          t.assigneeId === id ? { ...t, assigneeId: null } : t,
        ),
      }))
    },
    [commit],
  )

  const addCategory = useCallback(
    (category: Omit<Category, 'id'>) => {
      commit((prev) => ({
        ...prev,
        categories: [...prev.categories, { ...category, id: uuid() }],
      }))
    },
    [commit],
  )

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      commit((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }))
    },
    [commit],
  )

  const deleteCategory = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        tasks: prev.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
      }))
    },
    [commit],
  )

  const addProject = useCallback(
    (project: Omit<Project, 'id'>) => {
      commit((prev) => ({
        ...prev,
        projects: [...prev.projects, { ...project, id: uuid() }],
      }))
    },
    [commit],
  )

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      commit((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }))
    },
    [commit],
  )

  const deleteProject = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
        tasks: prev.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
      }))
    },
    [commit],
  )

  const addGoal = useCallback(
    (goal: Omit<Goal, 'id'>) => {
      commit((prev) => ({
        ...prev,
        goals: [...prev.goals, { ...goal, id: uuid() }],
      }))
    },
    [commit],
  )

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      commit((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      }))
    },
    [commit],
  )

  const deleteGoal = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
      }))
    },
    [commit],
  )

  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const now = new Date().toISOString()
      commit((prev) => ({
        ...prev,
        notifications: [
          { ...notification, id: uuid(), createdAt: now, read: false },
          ...prev.notifications,
        ],
      }))
    },
    [commit],
  )

  const dismissNotification = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((notification) => notification.id !== id),
      }))
    },
    [commit],
  )

  const clearNotifications = useCallback(() => {
    commit((prev) => ({
      ...prev,
      notifications: [],
    }))
  }, [commit])

  const resetData = useCallback(() => {
    persist(seedData)
    setState(seedData)
  }, [])

  const getMember = useCallback(
    (id: string | null) =>
      id ? state.members.find((m) => m.id === id) : undefined,
    [state.members],
  )

  const getCategory = useCallback(
    (id: string | null) =>
      id ? state.categories.find((c) => c.id === id) : undefined,
    [state.categories],
  )

  const getProject = useCallback(
    (id: string | null) =>
      id ? state.projects.find((p) => p.id === id) : undefined,
    [state.projects],
  )

  const tasksByStatus = useCallback(
    (status: TaskStatus) => state.tasks.filter((t) => t.status === status && !t.archived),
    [state.tasks],
  )

  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return state.tasks.filter(
      (t) =>
        !t.archived &&
        t.dueDate &&
        t.dueDate < today &&
        t.status !== 'done',
    )
  }, [state.tasks])

  const stats = useMemo(
    () => ({
      total: state.tasks.filter((t) => !t.archived).length,
      done: state.tasks.filter((t) => !t.archived && t.status === 'done').length,
      inProgress: state.tasks.filter((t) => !t.archived && t.status === 'in_progress').length,
      overdue: overdueTasks.length,
      completedOnTime: state.tasks.filter(
        (t) =>
          !t.archived &&
          t.status === 'done' &&
          (!t.dueDate || t.updatedAt.slice(0, 10) <= t.dueDate),
      ).length,
      completedLate: state.tasks.filter(
        (t) =>
          !t.archived &&
          t.status === 'done' &&
          !!t.dueDate &&
          t.updatedAt.slice(0, 10) > t.dueDate,
      ).length,
      inReview: state.tasks.filter((t) => !t.archived && t.status === 'review').length,
      todo: state.tasks.filter((t) => !t.archived && t.status === 'todo').length,
    }),
    [state.tasks, overdueTasks],
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined)
    }

    const now = Date.now()
    const pending = state.tasks.filter((task) => {
      if (!task.reminder || task.archived || task.status === 'done' || !task.dueDate) return false
      if (task.reminder === 'custom') return false

      const due = new Date(`${task.dueDate}T23:59:59`)
      const reminderTime = (() => {
        switch (task.reminder) {
          case '5m':
            return due.getTime() - 5 * 60 * 1000
          case '30m':
            return due.getTime() - 30 * 60 * 1000
          case '1h':
            return due.getTime() - 60 * 60 * 1000
          case '1d':
            return due.getTime() - 24 * 60 * 60 * 1000
          default:
            return null
        }
      })()

      return reminderTime !== null && reminderTime <= now && !state.notifications.some((notification) => notification.taskId === task.id)
    })

    pending.forEach((task) => {
      const message = `Scadenza imminente: ${task.title}`
      addNotification({
        taskId: task.id,
        title: 'Promemoria task',
        message,
      })

      if (window.Notification.permission === 'granted') {
        new window.Notification('Promemoria task', { body: message })
      }
    })
  }, [addNotification, state.notifications, state.tasks])

  const value = useMemo(
    () => ({
      ...state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      archiveTask,
      restoreTask,
      addMember,
      updateMember,
      deleteMember,
      addCategory,
      updateCategory,
      deleteCategory,
      addProject,
      updateProject,
      deleteProject,
      addGoal,
      updateGoal,
      deleteGoal,
      addNotification,
      dismissNotification,
      clearNotifications,
      resetData,
      getMember,
      getCategory,
      getProject,
      tasksByStatus,
      overdueTasks,
      stats,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      archiveTask,
      restoreTask,
      addMember,
      updateMember,
      deleteMember,
      addCategory,
      updateCategory,
      deleteCategory,
      addProject,
      updateProject,
      deleteProject,
      addGoal,
      updateGoal,
      deleteGoal,
      addNotification,
      dismissNotification,
      clearNotifications,
      resetData,
      getMember,
      getCategory,
      getProject,
      tasksByStatus,
      overdueTasks,
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
