export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  color: string
}

export type GoalType = 'daily' | 'weekly'
export type GoalProgressStatus = 'in_progress' | 'reached'
export type GoalHistoryStatus = 'reached' | 'not_reached'

export interface GoalWithProgress {
  id: string
  userId: string
  type: GoalType
  target: number
  periodStart: string
  periodEnd: string
  completedTasks: number
  completionPercentage: number
  status: GoalProgressStatus
  createdAt: string
  updatedAt: string
}

export interface GoalHistory {
  id: string
  goalId: string
  userId: string
  type: GoalType
  target: number
  completedTasks: number
  completionPercentage: number
  status: GoalHistoryStatus
  periodStart: string
  periodEnd: string
  createdAt: string
}

export type ReminderType = 'none' | '5m' | '30m' | '1h' | '1d' | 'custom'

export interface Notification {
  id: string
  userId: string
  taskId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  readAt: string | null
}

export interface Category {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  taskCount?: number
}

export interface TaskNote {
  id: string
  taskId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  taskId?: string
  fileName: string
  originalName: string
  mimeType: string
  size: number
  path: string
  createdAt: string
  updatedAt: string
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
  categoryId: string | null
  dueDate: string | null
  reminderDate: string | null
  reminderType: ReminderType | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface AppState {
  members: TeamMember[]
  tasks: Task[]
}

export const REMINDER_LABELS: Record<ReminderType, string> = {
  none: 'Nessun promemoria',
  '5m': '5 minuti prima',
  '30m': '30 minuti prima',
  '1h': '1 ora prima',
  '1d': '1 giorno prima',
  custom: 'Personalizzato',
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
