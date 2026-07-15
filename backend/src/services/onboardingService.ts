import type { Database } from 'sqlite'
import type { CompanyRole } from '../data/companyRoles'
import { ONBOARDING_BY_ROLE } from '../data/companyRoles'
import { createTask } from './taskService'
import type { Task } from '../types'

function generateTaskId(): string {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export async function createOnboardingTaskForMember(
  memberId: string,
  role: CompanyRole,
  db: Database
): Promise<{ id: string; title: string }> {
  const template = ONBOARDING_BY_ROLE[role]
  const now = new Date().toISOString()
  const due = new Date()
  due.setDate(due.getDate() + 7)

  const task: Task = {
    id: generateTaskId(),
    title: template.title,
    description: template.description,
    notes: 'Task di benvenuto assegnata automaticamente alla registrazione.',
    status: 'todo',
    priority: template.priority,
    assigneeId: memberId,
    categoryId: 'cat-lavoro',
    projectId: null,
    dueDate: due.toISOString().slice(0, 10),
    reminderDate: null,
    reminderType: null,
    tags: template.tags,
    links: [],
    attachments: [],
    noteItems: [],
    createdAt: now,
    updatedAt: now,
    favorite: false,
    archived: false,
  }

  await createTask(task, db)
  return { id: task.id, title: task.title }
}
