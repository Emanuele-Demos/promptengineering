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
} from '../types'
import { MEMBER_COLORS } from '../types'
import { formatEstimatedTimeLong } from '../utils/estimatedTime'
import {
  computeAverageCompletionMs,
  countCompletedInRange,
  formatAverageCompletionTime,
  getTeamPeriodRanges,
} from '../utils/teamStats'
import {
  archiveTaskApi,
  deleteTaskPermanent,
  getArchivedTasks,
  getTasks,
  restoreTaskApi,
  syncTaskFavorite,
  syncTaskStatus,
} from '../api/tasks.js'
import { getMembers } from '../api/members.js'

interface AppContextValue extends AppState {
  loading: boolean
  error: string
  refreshData: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  toggleFavorite: (id: string) => void
  archiveTask: (id: string) => void
  restoreTask: (id: string) => void
  deleteTaskPermanently: (id: string) => void
  addMember: (member: Omit<TeamMember, 'id' | 'color'>) => void
  updateMember: (id: number, updates: Partial<TeamMember>) => void
  deleteMember: (id: number) => void
  getMember: (id: number | null) => TeamMember | undefined
  tasksByStatus: (status: TaskStatus) => Task[]
  overdueTasks: Task[]
  archivedTasks: Task[]
  stats: {
    total: number
    done: number
    open: number
    inProgress: number
    overdue: number
    completedToday: number
    completedWeek: number
    completedMonth: number
    completedOnTime: number
    completedLate: number
    inReview: number
    todo: number
    totalEstimatedMinutes: number
    totalEstimatedFormatted: string
    openTasksWithEstimate: number
    averageCompletionTime: string
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({ tasks: [], members: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshData = useCallback(async () => {
    setError('')
    try {
      const [activeTasks, archivedTasks, members] = await Promise.all([
        getTasks() as Promise<Task[]>,
        getArchivedTasks() as Promise<Task[]>,
        getMembers() as Promise<TeamMember[]>,
      ])
      setState({
        tasks: [...activeTasks, ...archivedTasks],
        members,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    refreshData()
  }, [refreshData])

  const commit = useCallback((updater: (prev: AppState) => AppState) => {
    setState(updater)
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
            id: -(prev.members.length + 1),
            color: MEMBER_COLORS[prev.members.length % MEMBER_COLORS.length],
          },
        ],
      }))
    },
    [commit],
  )

  const updateMember = useCallback(
    (id: number, updates: Partial<TeamMember>) => {
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
    (id: number) => {
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
    (id: number | null) =>
      id !== null ? state.members.find((m) => m.id === id) : undefined,
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
      const { todayStart, weekStart, monthStart, end } = getTeamPeriodRanges()
      const averageCompletionMs = computeAverageCompletionMs(activeTasks)

      return {
        total: activeTasks.length,
        done: activeTasks.filter((t) => t.status === 'done').length,
        open: openTasks.length,
        inProgress: activeTasks.filter((t) => t.status === 'in_progress').length,
        overdue: overdueTasks.length,
        completedToday: countCompletedInRange(activeTasks, todayStart, end),
        completedWeek: countCompletedInRange(activeTasks, weekStart, end),
        completedMonth: countCompletedInRange(activeTasks, monthStart, end),
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
        averageCompletionTime: formatAverageCompletionTime(
          averageCompletionMs,
          activeTasks.filter((t) => t.status === 'done').length,
        ),
      }
    },
    [activeTasks, overdueTasks],
  )

  const value = useMemo(
    () => ({
      ...state,
      loading,
      error,
      refreshData,
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
      getMember,
      tasksByStatus,
      overdueTasks,
      archivedTasks,
      stats,
    }),
    [
      state,
      loading,
      error,
      refreshData,
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
      getMember,
      tasksByStatus,
      overdueTasks,
      archivedTasks,
      stats,
    ],
  )

  if (loading) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Caricamento dati...</p>
      </div>
    )
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export type { TaskPriority, TaskStatus }
