import cron from 'node-cron';
import { randomUUID } from 'crypto';
import db from '../config/db.js';

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function calculateNextDate(currentDate, repeatType, repeatEvery = 1, repeatDays = []) {
  if (!currentDate || !repeatType || repeatType === 'none') return null;
  const base = new Date(`${currentDate}T00:00:00`);
  const every = Math.max(1, Number(repeatEvery) || 1);

  if (repeatType === 'daily') return formatDate(addDays(base, every));
  if (repeatType === 'weekly') {
    const days = Array.isArray(repeatDays) ? repeatDays.map(Number).sort((a, b) => a - b) : [];
    if (days.length > 0) {
      for (let offset = 1; offset <= 7 * every; offset += 1) {
        const candidate = addDays(base, offset);
        if (days.includes(candidate.getDay())) return formatDate(candidate);
      }
    }
    return formatDate(addDays(base, 7 * every));
  }
  if (repeatType === 'monthly') {
    const next = new Date(base);
    next.setMonth(next.getMonth() + every);
    return formatDate(next);
  }
  if (repeatType === 'yearly') {
    const next = new Date(base);
    next.setFullYear(next.getFullYear() + every);
    return formatDate(next);
  }
  if (repeatType === 'custom') return formatDate(addDays(base, every));

  return null;
}

function shouldStop(task, nextCount, nextDate) {
  if (task.repeatEnd && nextDate > task.repeatEnd) return true;
  if (task.repeatMaxOccurrences && nextCount >= Number(task.repeatMaxOccurrences)) return true;
  return false;
}

function createOccurrence(task) {
  const now = new Date().toISOString();
  const repeatDays = parseJson(task.repeatDays, []);
  const occurrenceId = randomUUID();
  const nextCount = Number(task.repeatCount || 0) + 1;
  const followingDate = calculateNextDate(task.repeatNextDate, task.repeatType, task.repeatEvery, repeatDays);
  const stopAfterCreation = shouldStop(task, nextCount, followingDate || task.repeatNextDate);

  db.serialize(() => {
    db.run(
      `INSERT INTO tasks
        (id, title, description, notes, links, status, priority, assigneeId, folderId, categoryId, dueDate, reminderDate, repeatType, repeatEvery, repeatEnd, repeatDays, repeatMaxOccurrences, repeatCount, repeatNextDate, repeatStopped, repeatParentId, tags, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        occurrenceId,
        task.title,
        task.description,
        task.notes || '',
        task.links || '[]',
        'todo',
        task.priority,
        task.assigneeId,
        task.folderId,
        task.categoryId,
        task.repeatNextDate,
        null,
        'none',
        null,
        null,
        '[]',
        null,
        0,
        null,
        0,
        task.id,
        task.tags || '[]',
        now,
        now,
      ],
    );

    db.run(
      'UPDATE tasks SET repeatCount = ?, repeatNextDate = ?, repeatStopped = ? WHERE id = ?',
      [nextCount, stopAfterCreation ? null : followingDate, stopAfterCreation ? 1 : 0, task.id],
    );
  });

  console.log(`Occorrenza ricorrente creata per task ${task.id}`);
}

export function startRecurringTaskScheduler() {
  cron.schedule('* * * * *', () => {
    const today = new Date().toISOString().slice(0, 10);

    db.all(
      `SELECT *
       FROM tasks
       WHERE repeatType IS NOT NULL
         AND repeatType != 'none'
         AND repeatStopped = 0
         AND repeatNextDate IS NOT NULL
         AND repeatNextDate <= ?`,
      [today],
      (err, rows) => {
        if (err) {
          console.error('Errore scheduler task ricorrenti:', err.message);
          return;
        }

        rows.forEach(createOccurrence);
      },
    );
  });

  console.log('Scheduler task ricorrenti attivo.');
}
