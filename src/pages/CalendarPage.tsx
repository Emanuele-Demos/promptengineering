import { useApp } from '../store/AppContext'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { Task } from '../types'

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function nextOccurrenceDate(currentDate: string, task: Task) {
  if (!task.repeatType || task.repeatType === 'none') return null
  const base = new Date(`${currentDate}T00:00:00`)
  const every = Math.max(1, task.repeatEvery ?? 1)

  if (task.repeatType === 'daily') return formatDate(addDays(base, every))
  if (task.repeatType === 'weekly') {
    const days = [...(task.repeatDays ?? [])].sort((a, b) => a - b)
    if (days.length > 0) {
      for (let offset = 1; offset <= 7 * every; offset += 1) {
        const candidate = addDays(base, offset)
        if (days.includes(candidate.getDay())) return formatDate(candidate)
      }
    }
    return formatDate(addDays(base, 7 * every))
  }
  if (task.repeatType === 'monthly') {
    const next = new Date(base)
    next.setMonth(next.getMonth() + every)
    return formatDate(next)
  }
  if (task.repeatType === 'yearly') {
    const next = new Date(base)
    next.setFullYear(next.getFullYear() + every)
    return formatDate(next)
  }
  if (task.repeatType === 'custom') return formatDate(addDays(base, every))
  return null
}

function futureOccurrences(task: Task) {
  if (!task.repeatType || task.repeatType === 'none' || task.repeatStopped) return []

  const occurrences = []
  const today = new Date().toISOString().slice(0, 10)
  let cursor = task.repeatNextDate || task.dueDate
  let count = task.repeatCount ?? 0
  const max = task.repeatMaxOccurrences ?? 12

  while (cursor && occurrences.length < 12) {
    if (cursor >= today) {
      occurrences.push({
        id: `${task.id}-future-${occurrences.length}`,
        title: `Ricorrenza: ${task.title}`,
        date: cursor,
        color: '#8b5cf6',
      })
    }

    count += 1
    if (task.repeatMaxOccurrences && count >= max) break
    const next = nextOccurrenceDate(cursor, task)
    if (!next || next === cursor) break
    if (task.repeatEnd && next > task.repeatEnd) break
    cursor = next
  }

  return occurrences
}

export function CalendarPage() {
  const { tasks } = useApp() // ✅ USO CORRETTO

  const taskEvents = tasks
    .filter(task => task.dueDate)
    .map(task => ({
      id: task.id,
      title: task.title,
      date: task.dueDate!,
      color: task.repeatParentId ? '#14b8a6' : '#6366f1',
    }))
  const recurrenceEvents = tasks.flatMap(futureOccurrences)
  const events = [...taskEvents, ...recurrenceEvents]

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Calendario ricorrenze</h1>
        <p className="text-sm text-slate-500 mt-1">
          Task pianificati, occorrenze generate e prossime ricorrenze future
        </p>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
      />
    </div>
  )
}
