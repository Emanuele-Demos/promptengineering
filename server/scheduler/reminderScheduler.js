import cron from 'node-cron';
import { randomUUID } from 'crypto';
import db from '../config/db.js';

function createReminderNotification(task) {
  const now = new Date().toISOString();
  const title = `Promemoria: ${task.title}`;
  const message = task.dueDate
    ? `Il task "${task.title}" ha scadenza ${task.dueDate}.`
    : `Il promemoria del task "${task.title}" e scaduto.`;

  db.run(
    `INSERT OR IGNORE INTO notifications
      (id, taskId, type, title, message, read, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), task.id, 'reminder', title, message, 0, now],
    (err) => {
      if (err) {
        console.error('Errore durante la creazione della notifica:', err.message);
        return;
      }
      console.log(`Notifica reminder generata per task ${task.id}`);
    },
  );
}

export function startReminderScheduler() {
  cron.schedule('* * * * *', () => {
    const now = new Date().toISOString();

    db.all(
      `SELECT id, title, dueDate, reminderDate
       FROM tasks
       WHERE reminderDate IS NOT NULL
         AND reminderDate <= ?
         AND status != 'done'`,
      [now],
      (err, rows) => {
        if (err) {
          console.error('Errore scheduler reminder:', err.message);
          return;
        }

        rows.forEach(createReminderNotification);
      },
    );
  });

  console.log('Scheduler promemoria attivo.');
}
