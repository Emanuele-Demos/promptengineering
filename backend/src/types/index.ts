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
  taskId?: string
  fileName: string
  path: string
  type: string
  size: number
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
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

interface AttachmentRow {
  id: string
  taskId: string
  fileName: string
  path: string
  type: string
  size: number
}

export type { TaskRow, AttachmentRow }
