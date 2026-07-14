import db from '../config/db.js';
import { v4 as uuid } from 'uuid';

const REMINDER_TYPES = ['none', '5m', '30m', '1h', '1d', 'custom'];

function buildReminderMessage(task) {
  return `Il task “${task.title}” scade il ${task.dueDate || 'presto'}.`;
}

export function normalizeReminderPayload(task) {
  const payload = {
    reminderDate: task.reminderDate || null,
    reminderType: task.reminderType || 'none',
    notificationSent: Boolean(task.notificationSent),
  };

  if (!REMINDER_TYPES.includes(payload.reminderType)) {
    payload.reminderType = 'none';
  }

  return payload;
}

export function createNotification(task) {
  const notification = {
    id: uuid(),
    taskId: task.id,
    title: `Promemoria: ${task.title}`,
    message: buildReminderMessage(task),
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.run(
    'INSERT INTO notifications (id, taskId, title, message, read, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [notification.id, notification.taskId, notification.title, notification.message, notification.read ? 1 : 0, notification.createdAt],
    (err) => {
      if (err) {
        console.error('Errore durante la creazione della notifica:', err.message);
      }
    },
  );

  return notification;
}

export function processPendingReminders() {
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks WHERE reminderDate IS NOT NULL AND notificationSent = 0 AND reminderDate <= ?', [now], (err, rows) => {
      if (err) return reject(err);

      const pending = rows || [];
      pending.forEach((task) => {
        createNotification(task);
        db.run('UPDATE tasks SET notificationSent = 1 WHERE id = ?', [task.id], (updateErr) => {
          if (updateErr) {
            console.error('Errore aggiornando notificationSent:', updateErr.message);
          }
        });
      });

      resolve(pending);
    });
  });
}
