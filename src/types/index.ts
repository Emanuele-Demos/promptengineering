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

export type StatisticsFilter = 'today' | '7d' | '30d' | 'year' | 'custom'

export interface StatisticsData {
  completedToday: number
  completedWeek: number
  completedMonth: number
  overdue: number
  open: number
  averageCompletionTime: string
  averageCompletionTimeMs: number
  filter: StatisticsFilter
  periodStart: string
  periodEnd: string
  previousPeriod?: {
    completed: number
    changePercent: number | null
  }
  weeklyTrend: Array<{ day: string; completed: number }>
  monthlyCompletions: Array<{ month: string; completed: number }>
  tasksByCategory: Array<{ category: string; count: number }>
  tasksByPriority: Array<{ priority: string; count: number }>
}

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

export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
export type RepeatCustomUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years'
export type RepeatEndType = 'never' | 'occurrences' | 'date'
export type RepeatDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type OccurrenceStatus = 'scheduled' | 'completed' | 'cancelled'

export interface TaskOccurrence {
  date: string
  time: string | null
  status: OccurrenceStatus
  sequence: number
}

export type StopRecurrenceMode = 'from_today' | 'after_last' | 'delete_future'

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

export interface ProjectTaskSummary {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  categoryId: string | null
  categoryName?: string | null
  dueDate: string | null
  isCompleted: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  owner?: TeamMember
  createdAt: string
  updatedAt: string
  totalTasks: number
  completedTasks: number
  progress: number
  isCompleted: boolean
  tasks?: ProjectTaskSummary[]
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
  projectId?: string | null
  dueDate: string | null
  reminderDate: string | null
  reminderType: ReminderType | null
  isRecurring?: boolean
  isRecurringActive?: boolean
  repeatType?: RepeatType | null
  repeatEvery?: number
  repeatCustomUnit?: RepeatCustomUnit | null
  repeatDays?: RepeatDay[]
  repeatEndType?: RepeatEndType
  repeatEnd?: string | null
  repeatOccurrences?: number | null
  maxOccurrences?: number | null
  occurrencesGenerated?: number
  currentOccurrences?: number
  lastGeneratedAt?: string | null
  nextOccurrence?: string | null
  parentTaskId?: string | null
  favorite?: boolean
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

export const REPEAT_TYPE_LABELS: Record<RepeatType, string> = {
  daily: 'Ogni giorno',
  weekly: 'Ogni settimana',
  monthly: 'Ogni mese',
  yearly: 'Ogni anno',
  custom: 'Personalizzata',
}

export const REPEAT_CUSTOM_UNIT_LABELS: Record<RepeatCustomUnit, string> = {
  hours: 'Ore',
  days: 'Giorni',
  weeks: 'Settimane',
  months: 'Mesi',
  years: 'Anni',
}

export const REPEAT_END_TYPE_LABELS: Record<RepeatEndType, string> = {
  never: 'Mai',
  occurrences: 'Dopo N occorrenze',
  date: 'Fino a una data',
}

export const REPEAT_DAY_LABELS: Record<RepeatDay, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Gio',
  friday: 'Ven',
  saturday: 'Sab',
  sunday: 'Dom',
}

export const REPEAT_DAYS: RepeatDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

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
