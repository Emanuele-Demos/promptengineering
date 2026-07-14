export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  color: string
}

export interface Attachment {
  id: string
  taskid?: string
  fileName: string
  path: string
  type: string
  size: number
}

export interface Folder {
  id: string
  name: string
  color: string
}

export interface Category {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  notes: string
  links: string[]
  attachments: Attachment[]
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  folderId?: string | null
  categoryId?: string | null
  dueDate: string | null
  tags: string[]
  reminderDate: string | null
  reminderType: 'none' | '5m' | '30m' | '1h' | '1d' | 'custom'
  notificationSent: boolean
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  taskId: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface Goal {
  id: string
  userId: string
  type: 'daily' | 'weekly'
  target: number
  createdAt: string
}

export interface GoalProgress {
  id: string
  goalId: string
  type: 'daily' | 'weekly'
  target: number
  completed: number
  percentage: number
  achieved: boolean
  createdAt: string
}

export interface GoalHistoryEntry {
  id: string
  goalId: string
  userId: string
  type: 'daily' | 'weekly'
  target: number
  completed: number
  percentage: number
  achieved: boolean
  createdAt: string
}

export interface StatisticsSummary {
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
}

export interface AppState {
  members: TeamMember[]
  folders: Folder[]
  categories: Category[]
  tasks: Task[]
  notifications: Notification[]
  goals: Goal[]
  goalsProgress: GoalProgress[]
  goalHistory: GoalHistoryEntry[]
  statistics: StatisticsSummary | null
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Da fare',
  in_progress: 'In corso',
  review: 'In revisione',
  done: 'Completato',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

export const MEMBER_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#0ea5e9',
  '#84cc16',
  '#ef4444',
]
