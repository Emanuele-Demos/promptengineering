import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
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
} from '../types'
import { MEMBER_COLORS } from '../types'
import { formatEstimatedTimeLong } from '../utils/estimatedTime'
import { syncTaskStatus, syncTaskFavorite, archiveTaskApi, restoreTaskApi, deleteTaskPermanent } from '../api/tasks.js'

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
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  toggleFavorite: (id: string) => void
  archiveTask: (id: string) => void
  restoreTask: (id: string) => void
  deleteTaskPermanently: (id: string) => void
  addMember: (member: Omit<TeamMember, 'id' | 'color'>) => void
  updateMember: (id: string, updates: Partial<TeamMember>) => void
  deleteMember: (id: string) => void
  resetData: () => void
  getMember: (id: string | null) => TeamMember | undefined
  tasksByStatus: (status: TaskStatus) => Task[]
  overdueTasks: Task[]
  archivedTasks: Task[]
  stats: {
    total: number
    done: number
    inProgress: number
    overdue: number
    completedOnTime: number
    completedLate: number
    inReview: number
    todo: number
    totalEstimatedMinutes: number
    totalEstimatedFormatted: string
    openTasksWithEstimate: number
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
      const id = uuid()
      commit((prev) => ({
        ...prev,
        tasks: [
          ...prev.tasks,
          { ...task, id, createdAt: now, updatedAt: now },
        ],
      }))
      return id
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
      syncTaskStatus(id, status).catch(() => {})
    },
    [updateTask],
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      commit((prev) => {
        const task = prev.tasks.find((t) => t.id === id)
        if (!task || task.archived) return prev

        const favorite = !Boolean(task.favorite)
        syncTaskFavorite(id, favorite).catch(() => {})

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? { ...t, favorite, updatedAt: new Date().toISOString() }
              : t,
          ),
        }
      })
    },
    [commit],
  )

  const archiveTask = useCallback(
    (id: string) => {
      commit((prev) => {
        const task = prev.tasks.find((t) => t.id === id)
        if (!task || task.archived) return prev

        const now = new Date().toISOString()
        archiveTaskApi(id).catch(() => {})

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? { ...t, archived: true, archivedAt: now, updatedAt: now }
              : t,
          ),
        }
      })
    },
    [commit],
  )

  const restoreTask = useCallback(
    (id: string) => {
      commit((prev) => {
        const task = prev.tasks.find((t) => t.id === id)
        if (!task || !task.archived) return prev

        const now = new Date().toISOString()
        restoreTaskApi(id).catch(() => {})

        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? { ...t, archived: false, archivedAt: null, updatedAt: now }
              : t,
          ),
        }
      })
    },
    [commit],
  )

  const deleteTaskPermanently = useCallback(
    (id: string) => {
      commit((prev) => {
        const task = prev.tasks.find((t) => t.id === id)
        if (!task?.archived) return prev

        deleteTaskPermanent(id).catch(() => {})
        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
        }
      })
    },
    [commit],
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

  const resetData = useCallback(() => {
    persist(seedData)
    setState(seedData)
  }, [])

  const activeTasks = useMemo(
    () => state.tasks.filter((t) => !t.archived),
    [state.tasks],
  )

  const archivedTasks = useMemo(
    () =>
      state.tasks
        .filter((t) => t.archived)
        .sort(
          (a, b) =>
            new Date(b.archivedAt ?? b.updatedAt).getTime() -
            new Date(a.archivedAt ?? a.updatedAt).getTime(),
        ),
    [state.tasks],
  )

  const getMember = useCallback(
    (id: string | null) =>
      id ? state.members.find((m) => m.id === id) : undefined,
    [state.members],
  )

  const tasksByStatus = useCallback(
    (status: TaskStatus) => activeTasks.filter((t) => t.status === status),
    [activeTasks],
  )

  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return activeTasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < today &&
        t.status !== 'done',
    )
  }, [activeTasks])

  const stats = useMemo(
    () => {
      const openTasks = activeTasks.filter((t) => t.status !== 'done')
      const totalEstimatedMinutes = openTasks.reduce(
        (sum, t) => sum + (t.estimatedTime ?? 0),
        0,
      )

      return {
        total: activeTasks.length,
        done: activeTasks.filter((t) => t.status === 'done').length,
        inProgress: activeTasks.filter((t) => t.status === 'in_progress').length,
        overdue: overdueTasks.length,
        completedOnTime: activeTasks.filter(
          (t) =>
            t.status === 'done' &&
            (!t.dueDate || t.updatedAt.slice(0, 10) <= t.dueDate),
        ).length,
        completedLate: activeTasks.filter(
          (t) =>
            t.status === 'done' &&
            !!t.dueDate &&
            t.updatedAt.slice(0, 10) > t.dueDate,
        ).length,
        inReview: activeTasks.filter((t) => t.status === 'review').length,
        todo: activeTasks.filter((t) => t.status === 'todo').length,
        totalEstimatedMinutes,
        totalEstimatedFormatted: formatEstimatedTimeLong(totalEstimatedMinutes),
        openTasksWithEstimate: openTasks.filter((t) => (t.estimatedTime ?? 0) > 0).length,
      }
    },
    [activeTasks, overdueTasks],
  )

  const value = useMemo(
    () => ({
      ...state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      toggleFavorite,
      archiveTask,
      restoreTask,
      deleteTaskPermanently,
      addMember,
      updateMember,
      deleteMember,
      resetData,
      getMember,
      tasksByStatus,
      overdueTasks,
      archivedTasks,
      stats,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      toggleFavorite,
      archiveTask,
      restoreTask,
      deleteTaskPermanently,
      addMember,
      updateMember,
      deleteMember,
      resetData,
      getMember,
      tasksByStatus,
      overdueTasks,
      archivedTasks,
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
