import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import itLocale from '@fullcalendar/core/locales/it'
import type { EventClickArg } from '@fullcalendar/core'
import { useApp } from '../store/AppContext'
import type { TaskStatus } from '../types'

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#6366f1',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#10b981',
}

export function CalendarPage() {
  const navigate = useNavigate()
  const { tasks } = useApp()

  const events = useMemo(
    () =>
      tasks
        .filter((task) => !task.archived && task.dueDate)
        .map((task) => ({
          id: task.id,
          title: task.title,
          date: task.dueDate!,
          backgroundColor: STATUS_COLORS[task.status],
          borderColor: STATUS_COLORS[task.status],
        })),
    [tasks],
  )

  const handleEventClick = (info: EventClickArg) => {
    navigate('/board', { state: { openTaskId: info.event.id } })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Calendario</h1>
        <p className="text-sm text-slate-500 mt-1">
          Task con scadenza — clicca un evento per aprirlo dalla board
        </p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm calendar-page">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          locale={itLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth',
          }}
          buttonText={{
            today: 'Oggi',
            month: 'Mese',
          }}
          height="auto"
          events={events}
          eventClick={handleEventClick}
        />
      </div>
    </div>
  )
}
