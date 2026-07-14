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
