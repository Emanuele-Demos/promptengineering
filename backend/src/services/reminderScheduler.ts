import cron from 'node-cron'
import type { Database } from 'sqlite'
import { getDatabase } from '../config/database'
import { buildReminderMessage, type ReminderType } from '../utils/reminderValidation'
import { createNotification, notificationExistsForTaskReminder } from './notificationService'

interface DueReminderRow {
  id: string
  title: string
  description: string
  dueDate: string | null
  assigneeId: string | null
  reminderDate: string
  reminderType: string
}

const DEFAULT_USER_ID = 'm1'

export async function processDueReminders(db?: Database): Promise<number> {
  const connection = db ?? (await getDatabase())
  const now = new Date().toISOString()

  const tasks = (await connection.all(
    `SELECT id, title, description, dueDate, assigneeId, reminderDate, reminderType
     FROM tasks
     WHERE reminderDate IS NOT NULL
       AND reminderDate <= ?
       AND reminderSentAt IS NULL
       AND status != 'done'`,
    [now]
  )) as DueReminderRow[]

  let processed = 0

  for (const task of tasks) {
    const alreadySent = await notificationExistsForTaskReminder(
      task.id,
      task.reminderDate,
      connection
    )
    if (alreadySent) {
      await connection.run(
        `UPDATE tasks SET reminderSentAt = ? WHERE id = ?`,
        [now, task.id]
      )
      continue
    }

    const userId = task.assigneeId ?? DEFAULT_USER_ID
    const message = buildReminderMessage(
      task.title,
      task.reminderType as ReminderType,
      task.dueDate
    )

    await createNotification(
      {
        userId,
        taskId: task.id,
        title: task.title,
        message,
      },
      connection
    )

    await connection.run(
      `UPDATE tasks SET reminderSentAt = ? WHERE id = ?`,
      [now, task.id]
    )

    processed += 1
  }

  return processed
}

export function startReminderScheduler(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const count = await processDueReminders()
      if (count > 0) {
        console.log(`🔔 Promemoria elaborati: ${count}`)
      }
    } catch (error) {
      console.error('Errore scheduler promemoria:', error)
    }
  })

  console.log('⏰ Scheduler promemoria avviato (ogni minuto)')
}
