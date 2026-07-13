import { useApp } from '../store/AppContext'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

export function CalendarPage() {
  const { tasks } = useApp() // ✅ USO CORRETTO

  const events = tasks
    .filter(task => task.dueDate)
    .map(task => ({
      id: task.id,
      title: task.title,
      date: task.dueDate!,
    }))

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Calendar</h1>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
      />
    </div>
  )
}