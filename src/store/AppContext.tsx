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
    if (raw) {
      const state = JSON.parse(raw) as AppState
      const oldCategoryNames = ['Lavoro', 'Casa', 'Università']
      const hasOldCategories = state.categories.some((c) => oldCategoryNames.includes(c.name))
      if (hasOldCategories || state.categories.length === 0) {
        state.categories = [
          { id: 'c1', name: 'managemement', color: '#ef4444' },
          { id: 'c2', name: 'clienti', color: '#3b82f6' },
          { id: 'c3', name: 'fatture', color: '#10b981' },
          { id: 'c4', name: 'varie', color: '#f59e0b' },
        ]
        state.tasks = state.tasks.map((t) => {
          if (t.categoryId && !['c1', 'c2', 'c3', 'c4'].includes(t.categoryId)) {
            return { ...t, categoryId: null }
          }
          return t
        })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      }
      return state
    }
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
  moveTaskPosition: (taskId: string, direction: 'up' | 'down' | 'top') => void
  dragReorderTasks: (draggedId: string, targetId: string) => void
  addMember: (member: Omit<TeamMember, 'id' | 'color'>) => void
  updateMember: (id: string, updates: Partial<TeamMember>) => void
  deleteMember: (id: string) => void
  addCategory: (name: string, color: string) => void
  updateCategory: (id: string, name: string, color: string) => void
  deleteCategory: (id: string) => void
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

  const moveTaskPosition = useCallback(
    (taskId: string, direction: 'up' | 'down' | 'top') => {
      commit((prev) => {
        const tasks = [...prev.tasks]
        const index = tasks.findIndex((t) => t.id === taskId)
        if (index === -1) return prev

        const targetTask = tasks[index]
        const catId = targetTask.categoryId

        // Find all tasks in the same category
        const catTasksIndices = tasks
          .map((t, idx) => (t.categoryId === catId ? idx : -1))
          .filter((idx) => idx !== -1)

        const relativeIndex = catTasksIndices.indexOf(index)
        if (relativeIndex === -1) return prev

        if (direction === 'up' && relativeIndex > 0) {
          const swapIndex = catTasksIndices[relativeIndex - 1]
          tasks[index] = tasks[swapIndex]
          tasks[swapIndex] = targetTask
        } else if (direction === 'down' && relativeIndex < catTasksIndices.length - 1) {
          const swapIndex = catTasksIndices[relativeIndex + 1]
          tasks[index] = tasks[swapIndex]
          tasks[swapIndex] = targetTask
        } else if (direction === 'top' && relativeIndex > 0) {
          const firstCatIndex = catTasksIndices[0]
          tasks.splice(index, 1)
          tasks.splice(firstCatIndex, 0, targetTask)
        }

        return {
          ...prev,
          tasks,
        }
      })
    },
    [commit],
  )

  const dragReorderTasks = useCallback(
    (draggedId: string, targetId: string) => {
      commit((prev) => {
        const tasks = [...prev.tasks]
        const draggedIndex = tasks.findIndex((t) => t.id === draggedId)
        const targetIndex = tasks.findIndex((t) => t.id === targetId)

        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
          return prev
        }

        const [draggedTask] = tasks.splice(draggedIndex, 1)
        const adjustedTargetIndex = tasks.findIndex((t) => t.id === targetId)
        tasks.splice(adjustedTargetIndex, 0, draggedTask)

        return {
          ...prev,
          tasks,
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

  const addCategory = useCallback(
    (name: string, color: string) => {
      commit((prev) => ({
        ...prev,
        categories: [
          ...prev.categories,
          { id: uuid(), name, color },
        ],
      }))
    },
    [commit],
  )

  const updateCategory = useCallback(
    (id: string, name: string, color: string) => {
      commit((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === id ? { ...c, name, color } : c,
        ),
      }))
    },
    [commit],
  )

  const deleteCategory = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        tasks: prev.tasks.map((t) =>
          t.categoryId === id ? { ...t, categoryId: null } : t,
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
      moveTaskPosition,
      dragReorderTasks,
      addMember,
      updateMember,
      deleteMember,
      addCategory,
      updateCategory,
      deleteCategory,
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
      moveTaskPosition,
      dragReorderTasks,
      addMember,
      updateMember,
      deleteMember,
      addCategory,
      updateCategory,
      deleteCategory,
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
