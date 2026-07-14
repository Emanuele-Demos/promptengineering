export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  color: string
}

export interface TaskNote {
  id: string
  taskId: string
  content: string
  createdAt: string
  updatedAt: string
}

export type GoalType = 'daily' | 'weekly'
export type GoalProgressStatus = 'in_progress' | 'reached'
export type GoalHistoryStatus = 'reached' | 'not_reached'

export interface Goal {
  id: string
  userId: string
  type: GoalType
  target: number
  periodStart: string
  createdAt: string
  updatedAt: string
}

export interface GoalWithProgress extends Goal {
  periodEnd: string
  completedTasks: number
  completionPercentage: number
  status: GoalProgressStatus
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
  noteItems: TaskNote[]
  links: string[]
  attachments: Attachment[]
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  categoryId: string | null
  category?: Category | null
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

interface TaskRow {
  id: string
  title: string
  description: string
  notes: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  categoryId: string | null
  dueDate: string | null
  reminderDate: string | null
  reminderType: string | null
  reminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

interface AttachmentRow {
  id: string
  taskId: string
  fileName: string
  originalName: string
  mimeType: string
  size: number
  path: string
  createdAt: string
  updatedAt: string
}

interface TaskNoteRow {
  id: string
  taskId: string
  content: string
  createdAt: string
  updatedAt: string
}

export type { TaskRow, AttachmentRow, TaskNoteRow }
