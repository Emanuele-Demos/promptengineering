import type { NextFunction, Request, Response } from 'express'
import type { TaskPriority, TaskStatus } from '../types'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export function validateTaskBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { title, status, priority } = req.body

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ message: 'Il titolo è obbligatorio' })
    return
  }

  if (status && !STATUSES.includes(status)) {
    res.status(400).json({ message: 'Status non valido' })
    return
  }

  if (priority && !PRIORITIES.includes(priority)) {
    res.status(400).json({ message: 'Priorità non valida' })
    return
  }

  const { favorite } = req.body
  if (
    favorite !== undefined &&
    typeof favorite !== 'boolean' &&
    favorite !== 'true' &&
    favorite !== 'false' &&
    favorite !== 0 &&
    favorite !== 1 &&
    favorite !== '0' &&
    favorite !== '1'
  ) {
    res.status(400).json({ message: 'Il campo favorite deve essere booleano' })
    return
  }

  const { estimatedTime } = req.body
  if (
    estimatedTime !== undefined &&
    estimatedTime !== null &&
    estimatedTime !== '' &&
    (typeof estimatedTime !== 'number' || !Number.isInteger(estimatedTime) || estimatedTime <= 0)
  ) {
    res.status(400).json({ message: 'Il tempo stimato deve essere un intero positivo (minuti)' })
    return
  }

  next()
}
