import db from '../config/db.js';
import { v4 as uuid } from 'uuid';

const normalizeGoal = (row) => ({
  id: row.id,
  userId: row.userId,
  type: row.type,
  target: Number(row.target),
  createdAt: row.createdAt,
});

function parseDate(value) {
  return value ? new Date(value) : null;
}

function getDateRange(type, referenceDate = new Date()) {
  const start = type === 'daily'
    ? new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
    : new Date(referenceDate);

  if (type === 'daily') {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return { start: weekStart, end: weekEnd };
}

export function getCurrentGoalsForUser(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM goals WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, rows) => {
      if (err) return reject(err);

      db.all('SELECT * FROM tasks', [], (taskErr, tasks) => {
        if (taskErr) return reject(taskErr);

        const goals = (rows || []).map(normalizeGoal);
        const result = goals.map((goal) => {
          const { start, end } = getDateRange(goal.type);
          const completed = (tasks || []).filter((task) => {
            const completedAt = parseDate(task.completedAt);
            return task.status === 'done' && completedAt && completedAt >= start && completedAt < end;
          }).length;

          const percentage = goal.target > 0 ? Math.min(100, Math.round((completed / goal.target) * 100)) : 0;
          return {
            id: goal.id,
            goalId: goal.id,
            type: goal.type,
            target: goal.target,
            completed,
            percentage,
            achieved: completed >= goal.target,
            createdAt: goal.createdAt,
          };
        });

        resolve(result);
      });
    });
  });
}

export function getGoalsForUser(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM goals WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, rows) => {
      if (err) return reject(err);
      resolve((rows || []).map(normalizeGoal));
    });
  });
}

export function createGoal(userId, payload) {
  return new Promise((resolve, reject) => {
    const goal = {
      id: uuid(),
      userId,
      type: payload.type,
      target: Number(payload.target),
      createdAt: new Date().toISOString(),
    };

    db.run(
      'INSERT INTO goals (id, userId, type, target, createdAt) VALUES (?, ?, ?, ?, ?)',
      [goal.id, goal.userId, goal.type, goal.target, goal.createdAt],
      (err) => {
        if (err) return reject(err);

        db.run(
          'INSERT INTO goal_history (id, userId, goalId, type, target, completedCount, percentage, achieved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [uuid(), userId, goal.id, goal.type, goal.target, 0, 0, false, new Date().toISOString()],
          (historyErr) => {
            if (historyErr) return reject(historyErr);
            resolve(goal);
          },
        );
      },
    );
  });
}

export function updateGoal(goalId, payload) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM goals WHERE id = ?', [goalId], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Obiettivo non trovato'));

      const updatedGoal = {
        ...row,
        target: Number(payload.target ?? row.target),
      };

      db.run('UPDATE goals SET target = ? WHERE id = ?', [updatedGoal.target, goalId], (updateErr) => {
        if (updateErr) return reject(updateErr);

        db.run(
          'INSERT INTO goal_history (id, userId, goalId, type, target, completedCount, percentage, achieved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [uuid(), row.userId, goalId, row.type, updatedGoal.target, 0, 0, false, new Date().toISOString()],
          (historyErr) => {
            if (historyErr) return reject(historyErr);
            resolve(updatedGoal);
          },
        );
      });
    });
  });
}

export function deleteGoal(goalId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM goals WHERE id = ?', [goalId], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Obiettivo non trovato'));

      db.run('DELETE FROM goals WHERE id = ?', [goalId], (deleteErr) => {
        if (deleteErr) return reject(deleteErr);
        db.run(
          'INSERT INTO goal_history (id, userId, goalId, type, target, completedCount, percentage, achieved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [uuid(), row.userId, goalId, row.type, row.target, 0, 0, false, new Date().toISOString()],
          (historyErr) => {
            if (historyErr) return reject(historyErr);
            resolve({ deleted: true });
          },
        );
      });
    });
  });
}

export function getGoalHistoryForUser(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM goal_history WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, rows) => {
      if (err) return reject(err);
      resolve((rows || []).map((row) => ({
        id: row.id,
        goalId: row.goalId,
        userId: row.userId,
        type: row.type,
        target: Number(row.target),
        completed: Number(row.completedCount),
        percentage: Number(row.percentage),
        achieved: Boolean(row.achieved),
        createdAt: row.createdAt,
      })));
    });
  });
}
