export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type GoalType = 'daily' | 'weekly'
export type ReminderOption = '5m' | '30m' | '1h' | '1d' | 'custom'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  color: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface Project {
  id: string
  name: string
  description: string
  owner: string
}

export interface Goal {
  id: string
  userId: string
  type: GoalType
  target: number
  createdAt: string
}

export interface Attachment {
  id: string
  name: string
  url: string
}

export interface AppNotification {
  id: string
  taskId: string
  title: string
  message: string
  createdAt: string
  read: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string | null
  tags: string[]
  favorite?: boolean
  categoryId?: string | null
  reminder?: ReminderOption | null
  customReminder?: string | null
  estimatedMinutes?: number | null
  projectId?: string | null
  archived?: boolean
  repeatType?: string | null
  repeatEvery?: number | null
  repeatEnd?: string | null
  notes?: string
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface AppState {
  members: TeamMember[]
  tasks: Task[]
  categories: Category[]
  projects: Project[]
  goals: Goal[]
  notifications: AppNotification[]
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
