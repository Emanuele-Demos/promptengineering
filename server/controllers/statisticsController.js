import db from '../config/db.js';

const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const PRIORITY_LABELS = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Bassa',
};

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function parseTags(tags) {
  try {
    return JSON.parse(tags || '[]');
  } catch {
    return [];
  }
}

function formatAverageCompletion(hours) {
  if (!Number.isFinite(hours)) return '0 ore';
  return hours > 24 ? `${(hours / 24).toFixed(1)} giorni` : `${Math.round(hours)} ore`;
}

function countCompletedBetween(tasks, start, end) {
  return tasks.filter((task) => {
    if (task.status !== 'done' || !task.updatedAt) return false;
    const updatedAt = new Date(task.updatedAt);
    return updatedAt >= start && updatedAt <= end;
  }).length;
}

function buildStatistics(tasks, categories) {
  const now = new Date();
  const today = startOfDay(now);
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayIso = now.toISOString().slice(0, 10);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const doneTasks = tasks.filter((task) => task.status === 'done');
  const totalCompletionHours = doneTasks.reduce((total, task) => {
    if (!task.createdAt || !task.updatedAt) return total;
    const diff = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
    return total + Math.max(0, diff / (1000 * 60 * 60));
  }, 0);

  const averageCompletionHours = doneTasks.length > 0 ? totalCompletionHours / doneTasks.length : 0;

  const weeklyTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      name: WEEK_DAYS[date.getDay()],
      task: countCompletedBetween(tasks, startOfDay(date), endOfDay(date)),
    };
  });

  const monthlyCompletions = Array.from({ length: 3 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      name: MONTH_NAMES[date.getMonth()],
      task: countCompletedBetween(tasks, date, monthEnd),
    };
  });

  const categoriesMap = {};
  tasks.forEach((task) => {
    const tags = parseTags(task.tags);
    const categoryName = categoryById.get(task.categoryId)?.name || tags[0] || 'Generale';
    categoriesMap[categoryName] = (categoriesMap[categoryName] || 0) + 1;
  });

  const priorityMap = {};
  tasks.forEach((task) => {
    const priorityName = PRIORITY_LABELS[task.priority] || task.priority || 'Media';
    priorityMap[priorityName] = (priorityMap[priorityName] || 0) + 1;
  });

  return {
    indicators: {
      completedToday: countCompletedBetween(tasks, today, endOfDay(now)),
      completedThisWeek: tasks.filter((task) => task.status === 'done' && new Date(task.updatedAt) >= oneWeekAgo).length,
      completedThisMonth: tasks.filter((task) => task.status === 'done' && new Date(task.updatedAt) >= monthStart).length,
      overdue: tasks.filter((task) => task.dueDate && task.dueDate < todayIso && task.status !== 'done').length,
      open: tasks.filter((task) => task.status !== 'done').length,
      averageCompletionTime: formatAverageCompletion(averageCompletionHours),
      averageCompletionHours,
    },
    charts: {
      weeklyTrend,
      monthlyCompletions,
      tasksByCategory: Object.entries(categoriesMap).map(([name, value]) => ({ name, value })),
      tasksByPriority: Object.entries(priorityMap).map(([name, value]) => ({ name, value })),
    },
  };
}

export const getStatistics = (_req, res) => {
  db.all('SELECT * FROM tasks', [], (tasksErr, tasks) => {
    if (tasksErr) return res.status(500).json({ error: tasksErr.message });

    db.all('SELECT * FROM categories', [], (categoriesErr, categories) => {
      if (categoriesErr) return res.status(500).json({ error: categoriesErr.message });
      res.json(buildStatistics(tasks, categories));
    });
  });
};
