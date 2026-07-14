import type { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import type { Task } from '../types'
import * as taskService from '../services/taskService'
import { getParam } from '../utils/params'
import {
  isReminderType,
  resolveReminderFields,
  type ReminderType,
} from '../utils/reminderValidation'

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function buildTaskPayload(
  body: Record<string, unknown>,
  existing?: Task
): Omit<Task, 'id' | 'noteItems' | 'attachments'> & { reminderChanged: boolean } {
  const now = new Date().toISOString()

  const dueDate =
    body.dueDate !== undefined
      ? ((body.dueDate as string | null) || null)
      : (existing?.dueDate ?? null)

  const rawReminderType = body.reminderType ?? existing?.reminderType ?? 'none'
  const reminderType: ReminderType = isReminderType(rawReminderType)
    ? rawReminderType
    : 'none'

  const customReminderDate =
    body.reminderDate !== undefined
      ? ((body.reminderDate as string | null) || null)
      : existing?.reminderDate ?? null

  const { reminderDate, reminderChanged } = resolveReminderFields({
    dueDate,
    reminderType,
    reminderDate: reminderType === 'custom' ? customReminderDate : null,
    existingReminderDate: existing?.reminderDate ?? null,
    existingReminderType: existing?.reminderType ?? null,
  })

  return {
    title: (body.title as string)?.trim() ?? existing?.title ?? '',
    description: (body.description as string) ?? existing?.description ?? '',
    notes: (body.notes as string) ?? existing?.notes ?? '',
    links: body.links !== undefined ? normalizeStringArray(body.links) : (existing?.links ?? []),
    status: (body.status as Task['status']) ?? existing?.status ?? 'todo',
    priority: (body.priority as Task['priority']) ?? existing?.priority ?? 'medium',
    assigneeId:
      body.assigneeId !== undefined
        ? ((body.assigneeId as string | null) || null)
        : (existing?.assigneeId ?? null),
    categoryId:
      body.categoryId !== undefined
        ? ((body.categoryId as string | null) || null)
        : (existing?.categoryId ?? null),
    dueDate,
    reminderDate,
    reminderType: reminderType === 'none' ? null : reminderType,
    tags: body.tags !== undefined ? normalizeStringArray(body.tags) : (existing?.tags ?? []),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    reminderChanged,
  }
}

export async function getTasks(_req: Request, res: Response): Promise<void> {
  const tasks = await taskService.getAllTasks()
  res.json(tasks)
}

export async function getTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.getTaskById(getParam(req.params.id))
  if (!task) {
    res.status(404).json({ message: 'Task non trovato' })
    return
  }
  res.json(task)
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>
  const { reminderChanged, ...payload } = buildTaskPayload(body)
  const now = new Date().toISOString()
  const task: Task = {
    id: typeof body.id === 'string' && body.id ? body.id : randomUUID(),
    ...payload,
    noteItems: [],
    attachments: [],
    createdAt: now,
    updatedAt: now,
  }

  const saved = await taskService.upsertTask(task, { resetReminderSent: reminderChanged })
  res.status(201).json(saved)
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const existing = await taskService.getTaskById(id)
  if (!existing) {
    res.status(404).json({ message: 'Task non trovato' })
    return
  }

  const { reminderChanged, ...payload } = buildTaskPayload(req.body, existing)
  const dueDateChanged =
    req.body.dueDate !== undefined && payload.dueDate !== existing.dueDate
  const shouldResetReminder = Boolean(
    reminderChanged ||
      (dueDateChanged && payload.reminderType && payload.reminderType !== 'none')
  )

  const task = await taskService.updateTask(id, payload, {
    resetReminderSent: shouldResetReminder,
  })
  res.json(task)
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const id = getParam(req.params.id)
  const existing = await taskService.getTaskById(id)
  if (!existing) {
    res.status(404).json({ message: 'Task non trovato' })
    return
  }

  await taskService.deleteTask(id)
  res.json({ message: 'Task eliminato' })
}
