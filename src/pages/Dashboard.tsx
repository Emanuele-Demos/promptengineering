import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Timer,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { useGoals } from '../hooks/useGoals'
import { useStatistics } from '../hooks/useStatistics'
import { GoalProgressCard } from '../components/GoalProgressCard'
import { STATUS_LABELS, type StatisticsFilter } from '../types'
import { MemberAvatar } from '../components/MemberAvatar'
import { PriorityBadge } from '../components/PriorityBadge'
import { formatDate, statusStyles } from '../utils/helpers'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORI_CATEGORIE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6']
const MAPPATURA_COLORI_PRIORITA: Record<string, string> = {
  Urgente: '#ef4444',
  Alta: '#f97316',
  Media: '#eab308',
  Bassa: '#10b981',
  Urgent: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#10b981',
}

const FILTER_OPTIONS: { value: StatisticsFilter; label: string }[] = [
  { value: 'today', label: 'Oggi' },
  { value: '7d', label: 'Ultimi 7 giorni' },
  { value: '30d', label: 'Ultimi 30 giorni' },
  { value: 'year', label: 'Ultimo anno' },
  { value: 'custom', label: 'Personalizzato' },
]

export function Dashboard() {
  const { tasks, members, stats, overdueTasks, getMember } = useApp()
  const activeTasks = tasks.filter((t) => !t.archived)
  const { daily, weekly, loading: goalsLoading } = useGoals()
  const [filter, setFilter] = useState<StatisticsFilter>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const { data: statistics, loading, error, refresh } = useStatistics({
    filter,
    from: filter === 'custom' ? customFrom : undefined,
    to: filter === 'custom' ? customTo : undefined,
  })

  const recentTasks = [...activeTasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const memberWorkload = members.map((m) => ({
    member: m,
    active: activeTasks.filter((t) => t.assigneeId === m.id && t.status !== 'done').length,
    done: activeTasks.filter((t) => t.assigneeId === m.id && t.status === 'done').length,
  }))

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const statCards = statistics
    ? [
        {
          label: 'Task completati oggi',
          value: statistics.completedToday,
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50',
          delta: null as number | null,
        },
        {
          label: 'Task completati questa settimana',
          value: statistics.completedWeek,
          icon: TrendingUp,
          color: 'text-indigo-600 bg-indigo-50',
          delta: statistics.previousPeriod?.changePercent ?? null,
        },
        {
          label: 'Task completati questo mese',
          value: statistics.completedMonth,
          icon: CheckCircle2,
          color: 'text-blue-600 bg-blue-50',
          delta: null,
        },
        {
          label: 'Task in ritardo',
          value: statistics.overdue,
          icon: AlertTriangle,
          color: statistics.overdue > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50',
          delta: null,
        },
        {
          label: 'Task aperti',
          value: statistics.open,
          icon: Clock,
          color: 'text-amber-600 bg-amber-50',
          delta: null,
        },
        {
          label: 'Tempo totale stimato',
          value: stats.totalEstimatedFormatted,
          icon: Timer,
          color: 'text-violet-600 bg-violet-50',
          delta: null,
        },
        {
          label: 'Tempo medio di completamento',
          value: statistics.averageCompletionTime,
          icon: Clock,
          color: 'text-teal-600 bg-teal-50',
          delta: null,
        },
      ]
    : []

  const weeklyChartData =
    statistics?.weeklyTrend.map((item) => ({ name: item.day, task: item.completed })) ?? []
  const monthlyChartData =
    statistics?.monthlyCompletions.map((item) => ({ name: item.month, task: item.completed })) ?? []
  const categoryChartData =
    statistics?.tasksByCategory.map((item) => ({ name: item.category, value: item.count })) ?? []
  const priorityChartData =
    statistics?.tasksByPriority.map((item) => ({ name: item.priority, value: item.count })) ?? []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-slate-900">Statistiche e Produttività</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dashboard interattiva con KPI e grafici aggiornati dal backend.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatisticsFilter)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {filter === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </>
          )}
          <button
            type="button"
            onClick={() => refresh()}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Aggiorna statistiche"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading && !statistics
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-4 h-28 animate-pulse"
              />
            ))
          : statCards.map(({ label, value, icon: Icon, color, delta }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  {delta !== null && delta !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {delta >= 0 ? '+' : ''}
                      {delta}%
                    </span>
                  )}
                </div>
                <div>
                  <p className={`font-bold text-slate-900 ${typeof value === 'string' && value.includes(' ') ? 'text-base leading-snug' : 'text-2xl'}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider leading-tight">
                    {label}
                  </p>
                </div>
              </div>
            ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">I tuoi obiettivi</h2>
          <Link to="/obiettivi" className="text-sm text-indigo-600 hover:text-indigo-700">
            Gestisci obiettivi
          </Link>
        </div>
        {goalsLoading ? (
          <p className="text-sm text-slate-500">Caricamento obiettivi...</p>
        ) : daily || weekly ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {daily && <GoalProgressCard goal={daily} />}
            {weekly && <GoalProgressCard goal={weekly} />}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600">
            Nessun obiettivo impostato.{' '}
            <Link to="/obiettivi" className="text-indigo-600 hover:underline">
              Crea il tuo primo obiettivo
            </Link>
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Task recenti</h2>
              <Link
                to="/board"
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Vai al board <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTasks.map((task) => {
                const assignee = getMember(task.assigneeId)
                const style = statusStyles[task.status] || {
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                }
                return (
                  <div
                    key={task.id}
                    className="flex items-start sm:items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
                        >
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                    {assignee && (
                      <MemberAvatar name={assignee.name} color={assignee.color} size="sm" />
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {overdueTasks.length > 0 && (
            <section className="bg-red-50 rounded-xl border border-red-200 shadow-sm">
              <div className="p-4 border-b border-red-100">
                <h2 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Task in ritardo ({overdueTasks.length})
                </h2>
              </div>
              <div className="divide-y divide-red-100">
                {overdueTasks.map((task) => {
                  const assignee = getMember(task.assigneeId)
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900">{task.title}</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          Scadenza: {formatDate(task.dueDate)}
                        </p>
                      </div>
                      {assignee && (
                        <MemberAvatar name={assignee.name} color={assignee.color} size="sm" />
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Avanzamento</h2>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Completamento</span>
                <span className="text-sm font-bold text-indigo-600">{completionRate}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Carico di lavoro</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {memberWorkload.map(({ member, active, done }) => (
                <div key={member.id} className="flex items-center gap-3 p-4">
                  <MemberAvatar name={member.name} color={member.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
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

      <div className="pt-6 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Grafici analitici di produttività
        </h2>

        {loading && !statistics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white h-72 rounded-xl border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Andamento settimanale</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="task"
                      name="Task completati"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Completamenti mensili</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="task"
                      name="Task completati"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 w-full text-left">
                Task per categoria
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((_entry, index) => (
                        <Cell
                          key={`cell-cat-${index}`}
                          fill={COLORI_CATEGORIE[index % COLORI_CATEGORIE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 w-full text-left">
                Task per priorità
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                      fontSize={11}
                      dataKey="value"
                    >
                      {priorityChartData.map((entry, index) => (
                        <Cell
                          key={`cell-prio-${index}`}
                          fill={MAPPATURA_COLORI_PRIORITA[entry.name] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
