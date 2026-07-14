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
import {
  isRepeatEndType,
  isRepeatType,
  isRepeatCustomUnit,
  resolveRecurrenceFields,
} from '../utils/recurrenceValidation'

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return fallback
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isInteger(n) && n > 0 ? n : fallback
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

  const isRecurring =
    body.isRecurring !== undefined
      ? parseBoolean(body.isRecurring)
      : (existing?.isRecurring ?? false)

  const rawRepeatType = body.repeatType ?? existing?.repeatType ?? 'daily'
  const repeatType = isRepeatType(rawRepeatType) ? rawRepeatType : 'daily'

  const rawEndType = body.repeatEndType ?? existing?.repeatEndType ?? 'never'
  const repeatEndType = isRepeatEndType(rawEndType) ? rawEndType : 'never'

  const rawCustomUnit = body.repeatCustomUnit ?? existing?.repeatCustomUnit ?? 'days'
  const repeatCustomUnit = isRepeatCustomUnit(rawCustomUnit) ? rawCustomUnit : 'days'

  const recurrence = resolveRecurrenceFields({
    isRecurring,
    repeatType: isRecurring ? repeatType : null,
    repeatEvery: parsePositiveInt(body.repeatEvery, existing?.repeatEvery ?? 1),
    repeatCustomUnit: isRecurring && repeatType === 'custom' ? repeatCustomUnit : null,
    repeatEndType: isRecurring ? repeatEndType : 'never',
    repeatEnd:
      body.repeatEnd !== undefined
        ? ((body.repeatEnd as string | null) || null)
        : (existing?.repeatEnd ?? null),
    repeatOccurrences:
      body.repeatOccurrences !== undefined
        ? body.repeatOccurrences != null
          ? parsePositiveInt(body.repeatOccurrences, 1)
          : null
        : (existing?.repeatOccurrences ?? null),
    dueDate,
    existing: existing
      ? {
          repeatType: existing.repeatType,
          repeatEvery: existing.repeatEvery,
          repeatCustomUnit: existing.repeatCustomUnit,
          repeatEndType: existing.repeatEndType,
          repeatEnd: existing.repeatEnd,
          repeatOccurrences: existing.repeatOccurrences,
          occurrencesGenerated: existing.occurrencesGenerated,
          lastGeneratedAt: existing.lastGeneratedAt,
          parentTaskId: existing.parentTaskId,
        }
      : undefined,
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
    ...recurrence,
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
    occurrencesGenerated: payload.isRecurring ? 1 : 0,
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
