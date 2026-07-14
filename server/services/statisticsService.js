import db from '../config/db.js'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const PRIORITY_LABELS = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

function parseDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getCompletionDate(task) {
  if (task.completedAt) {
    return parseDate(task.completedAt)
  }

  if (task.status === 'done') {
    return parseDate(task.updatedAt || task.createdAt)
  }

  return null
}

function isCompletedInRange(task, start, end) {
  const completedAt = getCompletionDate(task)
  if (!completedAt) return false
  return completedAt >= start && completedAt <= end
}

function buildWeeklyTrend(tasks, startOfWeek) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)

    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)

    const completed = tasks.filter((task) => isCompletedInRange(task, start, end)).length

    return {
      day: DAY_NAMES[date.getDay()],
      completed,
    }
  })
}

function buildMonthlyCompletions(tasks, year) {
  return Array.from({ length: 12 }, (_, index) => {
    const start = new Date(year, index, 1)
    const end = new Date(year, index + 1, 0, 23, 59, 59, 999)
    const completed = tasks.filter((task) => isCompletedInRange(task, start, end)).length

    return {
      month: MONTH_NAMES[index],
      completed,
    }
  })
}

function buildCategoryStats(tasks, categories) {
  const categoryMap = {}

  tasks.forEach((task) => {
    const category = categories.find((item) => item.id === task.categoryId)
    const label = category?.name || 'Senza categoria'
    categoryMap[label] = (categoryMap[label] || 0) + 1
  })

  return Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

function buildPriorityStats(tasks) {
  const priorityMap = {}

  tasks.forEach((task) => {
    const label = PRIORITY_LABELS[task.priority] || task.priority || 'Media'
    priorityMap[label] = (priorityMap[label] || 0) + 1
  })

  return Object.entries(priorityMap)
    .map(([priority, count]) => ({ priority, count }))
    .sort((a, b) => b.count - a.count)
}

export function getStatisticsData() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks', [], (taskErr, taskRows) => {
      if (taskErr) return reject(taskErr)

      db.all('SELECT * FROM categories', [], (categoryErr, categoryRows) => {
        if (categoryErr) return reject(categoryErr)

        const tasks = (taskRows || []).map((row) => ({
          ...row,
          tags: JSON.parse(row.tags || '[]'),
        }))
        const categories = categoryRows || []

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        const startOfWeek = new Date(startOfToday)
        startOfWeek.setDate(startOfToday.getDate() - 6)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)

        const completedToday = tasks.filter((task) => isCompletedInRange(task, startOfToday, endOfToday)).length
        const completedWeek = tasks.filter((task) => isCompletedInRange(task, startOfWeek, endOfToday)).length
        const completedMonth = tasks.filter((task) => isCompletedInRange(task, startOfMonth, endOfToday)).length
        const openTasks = tasks.filter((task) => task.status !== 'done').length
        const overdueTasks = tasks.filter((task) => task.status !== 'done' && task.dueDate && parseDate(task.dueDate) < startOfToday).length

        const completedTasks = tasks.filter((task) => getCompletionDate(task))
        let totalHours = 0
        completedTasks.forEach((task) => {
          const createdAt = parseDate(task.createdAt)
          const completedAt = getCompletionDate(task)
          if (createdAt && completedAt) {
            const diffHours = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
            totalHours += Math.max(0, diffHours)
          }
        })

        const averageCompletionTime = completedTasks.length > 0 ? Number((totalHours / completedTasks.length).toFixed(2)) : 0

        const weeklyTrend = buildWeeklyTrend(tasks, startOfWeek)
        const monthlyCompletions = buildMonthlyCompletions(tasks, now.getFullYear())
        const tasksByCategory = buildCategoryStats(tasks, categories)
        const tasksByPriority = buildPriorityStats(tasks)

        resolve({
          completedToday,
          completedWeek,
          completedMonth,
          overdueTasks,
          openTasks,
          averageCompletionTime,
          weeklyTrend,
          monthlyCompletions,
          tasksByCategory,
          tasksByPriority,
          yearRange: {
            start: startOfYear.toISOString(),
            end: endOfYear.toISOString(),
          },
        })
      })
    })
  })
}
