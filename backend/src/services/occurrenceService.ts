import type { Database } from 'sqlite'
import { getDatabase } from '../config/database'
import type { Task } from '../types'
import { generateOccurrences, type TaskOccurrence } from '../utils/recurrenceValidation'
import { getTaskById } from './taskService'

export type StopRecurrenceMode = 'from_today' | 'after_last' | 'delete_future'

async function getSeriesTasks(
  rootId: string,
  db: Database
): Promise<Array<{ dueDate: string | null; status: string }>> {
  return (await db.all(
    `SELECT dueDate, status FROM tasks WHERE id = ? OR parentTaskId = ? ORDER BY dueDate ASC`,
    [rootId, rootId]
  )) as Array<{ dueDate: string | null; status: string }>
}

function getEffectiveLimit(task: Task): number {
  if (task.maxOccurrences) return task.maxOccurrences
  if (task.repeatOccurrences) return task.repeatOccurrences
  return 52
}

export async function getTaskOccurrences(taskId: string, db?: Database): Promise<TaskOccurrence[]> {
  const connection = db ?? (await getDatabase())
  const task = await getTaskById(taskId, connection)
  if (!task || !task.isRecurring || !task.dueDate) return []

  const rootId = task.parentTaskId ?? task.id
  const series = await getSeriesTasks(rootId, connection)
  const today = new Date().toISOString().slice(0, 10)

  const projected = generateOccurrences(
    {
      isRecurring: task.isRecurring,
      isRecurringActive: task.isRecurringActive,
      repeatType: task.repeatType,
      repeatEvery: task.repeatEvery,
      repeatCustomUnit: task.repeatCustomUnit,
      repeatDays: task.repeatDays,
      repeatEndType: task.repeatEndType,
      repeatEnd: task.repeatEnd,
      repeatOccurrences: task.repeatOccurrences,
      maxOccurrences: task.maxOccurrences,
      currentOccurrences: task.currentOccurrences ?? task.occurrencesGenerated,
      dueDate: task.dueDate,
      status: task.status,
    },
    { limit: getEffectiveLimit(task) }
  )

  const byDate = new Map<string, string>()
  for (const item of series) {
    if (item.dueDate) byDate.set(item.dueDate.slice(0, 10), item.status)
  }

  return projected.map((occ) => {
    const historical = byDate.get(occ.date)
    let status = occ.status
    if (historical) {
      status = historical === 'done' ? 'completed' : 'scheduled'
    } else if (occ.date < today && status === 'scheduled') {
      status = 'completed'
    }
    if (task.isRecurringActive === false && occ.date > today) {
      status = 'cancelled'
    }
    return { ...occ, status }
  })
}

export async function stopTaskRecurrence(
  taskId: string,
  mode: StopRecurrenceMode,
  db?: Database
): Promise<Task> {
  const connection = db ?? (await getDatabase())
  const task = await getTaskById(taskId, connection)
  if (!task) throw new Error('Task non trovato')
  if (!task.isRecurring) throw new Error('Il task non è ricorrente')

  const now = new Date().toISOString()
  const rootId = task.parentTaskId ?? task.id
  const today = now.slice(0, 10)

  await connection.run('BEGIN')
  try {
    if (mode === 'from_today') {
      await connection.run(
        `UPDATE tasks SET isRecurringActive = 0, isRecurring = 0, nextOccurrence = NULL, updatedAt = ? WHERE id = ?`,
        [now, taskId]
      )
    } else if (mode === 'after_last') {
      await connection.run(
        `UPDATE tasks SET isRecurringActive = 0, nextOccurrence = NULL, updatedAt = ? WHERE id = ?`,
        [now, taskId]
      )
    } else if (mode === 'delete_future') {
      await connection.run(
        `UPDATE tasks SET isRecurringActive = 0, isRecurring = 0, nextOccurrence = NULL, updatedAt = ? WHERE id = ?`,
        [now, taskId]
      )
      await connection.run(
        `DELETE FROM tasks
         WHERE (parentTaskId = ? OR id = ?)
           AND id != ?
           AND status != 'done'
           AND dueDate > ?`,
        [rootId, rootId, taskId, today]
      )
    }

    await connection.run('COMMIT')
  } catch (error) {
    await connection.run('ROLLBACK')
    throw error
  }

  const updated = await getTaskById(taskId, connection)
  if (!updated) throw new Error('Task non trovato')
  return updated
}
