import { useMemo, useState } from 'react'
import { CalendarClock, Gauge, Timer } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PRIORITY_LABELS, STATUS_LABELS, type Task, type TaskPriority } from '../types'
import { formatDate } from '../utils/helpers'
import { formatEstimatedTimeShort } from '../utils/estimatedTime'

type TieBreakerMode = 'dueDate' | 'shortest'

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const STATUS_PILL_STYLES: Record<string, string> = {
  todo: 'bg-slate-900 text-slate-100',
  in_progress: 'bg-slate-900 text-rose-100',
  review: 'bg-slate-900 text-violet-100',
  done: 'bg-slate-900 text-emerald-100',
}

const STATUS_DOT_STYLES: Record<string, string> = {
  todo: 'bg-green-500',
  in_progress: 'bg-red-500',
  review: 'bg-yellow-400',
  done: 'bg-white',
}

function getEstimatedMinutes(task: Task): number {
  return Math.max(task.estimatedTime ?? 0, 0)
}

function compareNullableDueDate(a: string | null, b: string | null): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b)
}

function formatHours(minutes: number): string {
  const hours = minutes / 60
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`
}

function forecastDateFromNow(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'Oggi'

  const workDayMinutes = 480
  const daysToAdd = Math.ceil(totalMinutes / workDayMinutes)
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysToAdd)
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ScadenzePage() {
  const { tasks, members, getMember } = useApp()
  const [tieBreaker, setTieBreaker] = useState<TieBreakerMode>('dueDate')
  const [weeklyCapacityHours, setWeeklyCapacityHours] = useState(40)
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'unassigned' | string>('all')

  const openTasks = useMemo(
    () => tasks.filter((task) => !task.archived && task.status !== 'done'),
    [tasks],
  )

  const filteredTasks = useMemo(() => {
    if (assigneeFilter === 'all') return openTasks
    if (assigneeFilter === 'unassigned') {
      return openTasks.filter((task) => task.assigneeId == null)
    }

    const assigneeId = Number(assigneeFilter)
    return openTasks.filter((task) => task.assigneeId === assigneeId)
  }, [assigneeFilter, openTasks])

  const sortedRows = useMemo(() => {
    const base = [...filteredTasks].sort((a, b) => {
      const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (byPriority !== 0) return byPriority

      if (tieBreaker === 'dueDate') {
        const byDueDate = compareNullableDueDate(a.dueDate, b.dueDate)
        if (byDueDate !== 0) return byDueDate
      } else {
        const byEstimate = getEstimatedMinutes(a) - getEstimatedMinutes(b)
        if (byEstimate !== 0) return byEstimate
      }

      return a.createdAt.localeCompare(b.createdAt)
    })

    const loadByMember = new Map<string, number>()

    return base.map((task) => {
      const memberKey = task.assigneeId != null ? String(task.assigneeId) : '__unassigned__'
      const currentLoad = loadByMember.get(memberKey) ?? 0
      const estimate = getEstimatedMinutes(task)
      const cumulativeLoad = currentLoad + estimate
      loadByMember.set(memberKey, cumulativeLoad)

      return {
        task,
        estimate,
        cumulativeLoad,
      }
    })
  }, [filteredTasks, tieBreaker])

  const totalsByPriority = useMemo(() => {
    const totals: Record<TaskPriority, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    for (const task of filteredTasks) {
      totals[task.priority] += getEstimatedMinutes(task)
    }

    return totals
  }, [filteredTasks])

  const urgentHighMinutes = totalsByPriority.urgent + totalsByPriority.high
  const weeklyCapacityMinutes = Math.max(weeklyCapacityHours, 0) * 60
  const capacityDeltaMinutes = weeklyCapacityMinutes - urgentHighMinutes

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Programmazione Scadenze</h1>
            <p className="mt-1 text-sm text-slate-600">
              Ordinamento automatico per priorita, stima tempo e previsione consegna dei task.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              A parita di priorita
            </label>
            <select
              value={tieBreaker}
              onChange={(event) => setTieBreaker(event.target.value as TieBreakerMode)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="dueDate">Scadenza piu vicina</option>
              <option value="shortest">Task piu veloce</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vista team
            </label>
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tutti i membri</option>
              <option value="unassigned">Non assegnati</option>
              {members.map((member) => (
                <option key={member.id} value={String(member.id)}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((priority) => (
          <article key={priority} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {PRIORITY_LABELS[priority]}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatHours(totalsByPriority[priority])}</p>
            <p className="mt-1 text-xs text-slate-500">tempo stimato rimanente</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Gauge className="h-4 w-4 text-indigo-600" />
            Capacita team su task urgenti e alti
          </div>

          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="weekly-capacity" className="text-slate-600">
              Capacita settimanale
            </label>
            <input
              id="weekly-capacity"
              type="number"
              min={0}
              value={weeklyCapacityHours}
              onChange={(event) => setWeeklyCapacityHours(Number(event.target.value) || 0)}
              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right font-medium"
            />
            <span className="text-slate-600">ore</span>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          Priorita alta + urgente: <strong>{formatHours(urgentHighMinutes)}</strong>.
          {capacityDeltaMinutes >= 0
            ? ` Capacita sufficiente: +${formatHours(capacityDeltaMinutes)} disponibili.`
            : ` Capacita insufficiente: ${formatHours(Math.abs(capacityDeltaMinutes))} oltre il limite.`}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm text-slate-800">
            <thead>
              <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <th className="border-b border-slate-300 px-4 py-3">Stato</th>
                <th className="border-b border-slate-300 px-4 py-3">Task</th>
                <th className="border-b border-slate-300 px-4 py-3">Priorita</th>
                <th className="border-b border-slate-300 px-4 py-3">Tempo stimato</th>
                <th className="border-b border-slate-300 px-4 py-3">Scadenza</th>
                <th className="border-b border-slate-300 px-4 py-3">Consegna prevista</th>
                <th className="border-b border-slate-300 px-4 py-3">Assegnato a</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(({ task, estimate, cumulativeLoad }) => {
                const assignee = getMember(task.assigneeId)
                return (
                  <tr key={task.id} className="deadline-task-row hover:bg-slate-50/80">
                    <td className="border-b border-slate-200 px-4 py-2.5">
                      <span
                        className={`deadline-status-pill inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${STATUS_PILL_STYLES[task.status]}`}
                      >
                        <span
                          className={`deadline-status-dot h-2.5 w-2.5 rounded-full ${STATUS_DOT_STYLES[task.status]}`}
                        />
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2.5 font-medium text-slate-900">
                      {task.title}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2.5">
                      {PRIORITY_LABELS[task.priority]}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2.5">
                      {estimate > 0 ? formatEstimatedTimeShort(estimate) : '—'}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2.5">
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
                        {forecastDateFromNow(cumulativeLoad)}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-2.5">
                      {assignee?.name ?? 'Non assegnato'}
                    </td>
                  </tr>
                )
              })}

              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Nessun task aperto da pianificare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="inline-flex items-center gap-2">
          <Timer className="h-4 w-4 text-indigo-500" />
          Tempo totale task aperti: <strong className="text-slate-900">{formatHours(filteredTasks.reduce((sum, task) => sum + getEstimatedMinutes(task), 0))}</strong>
        </p>
      </footer>
    </div>
  )
}
