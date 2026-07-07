import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { STATUS_LABELS } from '../types'
import { MemberAvatar } from '../components/MemberAvatar'
import { PriorityBadge } from '../components/PriorityBadge'
import { formatDate, statusStyles } from '../utils/helpers'

export function Dashboard() {
  const { tasks, members, stats, overdueTasks, getMember } = useApp()

  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5)

  const memberWorkload = members.map((m) => ({
    member: m,
    active: tasks.filter(
      (t) => t.assigneeId === m.id && t.status !== 'done',
    ).length,
    done: tasks.filter(
      (t) => t.assigneeId === m.id && t.status === 'done',
    ).length,
  }))

  const completionRate =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const statCards = [
    {
      label: 'Task totali',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'In corso',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Completati',
      value: stats.done,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'In ritardo',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Completati in tempo',
      value: stats.completedOnTime,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Completati in ritardo',
      value: stats.completedLate,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'In revisione',
      value: stats.inReview,
      icon: Clock, // or choose a more suitable icon if available
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Da fare',
      value: stats.todo,
      icon: Clock, // or choose a different icon if desired
      color: 'text-gray-600 bg-gray-50',
    },

    
  ]



  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <header className="mb-6 lg:mb-8 hidden lg:block">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Panoramica del team e avanzamento dei task
        </p>
      </header>
    

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 lg:mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs sm:text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Task recenti</h2>
              <Link
                to="/board"
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Vai al board
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTasks.map((task) => {
                const assignee = getMember(task.assigneeId)
                const style = statusStyles[task.status]
                return (
                  <div
                    key={task.id}
                    className="flex items-start sm:items-center gap-3 p-3 sm:p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
                        >
                          {STATUS_LABELS[task.status]}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                    {assignee && (
                      <MemberAvatar
                        name={assignee.name}
                        color={assignee.color}
                        size="sm"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {overdueTasks.length > 0 && (
            <section className="bg-red-50 rounded-xl border border-red-200">
              <div className="p-4 border-b border-red-100">
                <h2 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Task in ritardo ({overdueTasks.length})
                </h2>
              </div>
              <div className="divide-y divide-red-100">
                {overdueTasks.map((task) => {
                  const assignee = getMember(task.assigneeId)
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900">
                          {task.title}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          Scadenza: {formatDate(task.dueDate)}
                        </p>
                      </div>
                      {assignee && (
                        <MemberAvatar
                          name={assignee.name}
                          color={assignee.color}
                          size="sm"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900 mb-4">
              Avanzamento
            </h2>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Completamento</span>
                <span className="text-sm font-bold text-indigo-600">
                  {completionRate}%
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Carico di lavoro</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {memberWorkload.map(({ member, active, done }) => (
                <div key={member.id} className="flex items-center gap-3 p-4">
                  <MemberAvatar
                    name={member.name}
                    color={member.color}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-amber-600">{active} attivi</p>
                    <p className="text-emerald-600">{done} fatti</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
