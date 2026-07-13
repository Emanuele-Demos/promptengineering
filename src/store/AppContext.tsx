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
          { ...task, id: uuid(), createdAt: now, updatedAt: now },
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
      resetData,
      getMember,
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
