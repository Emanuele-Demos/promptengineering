import { useState, useMemo, Component, type ReactNode } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Target,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { STATUS_LABELS } from '../types'
import { MemberAvatar } from '../components/MemberAvatar'
import { PriorityBadge } from '../components/PriorityBadge'
import { formatDate, statusStyles } from '../utils/helpers'

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────
function getWeekStart(dateStr: string): string {
  // Accept both 'YYYY-MM-DD' and full ISO strings
  const datePart = dateStr.slice(0, 10)
  const d = new Date(datePart + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().slice(0, 10)
}

function getWeekEnd(weekStart: string): string {
  const datePart = weekStart.slice(0, 10)
  const d = new Date(datePart + 'T00:00:00')
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

function safeDate(v: unknown): string {
  if (typeof v === 'string') return v
  if (v instanceof Date) return v.toISOString()
  return new Date().toISOString()
}

function blockBar(current: number, target: number, blocks = 10): string {
  if (target === 0) return '░'.repeat(blocks)
  const filled = Math.round(Math.min(current / target, 1) * blocks)
  return '█'.repeat(filled) + '░'.repeat(blocks - filled)
}

// ──────────────────────────────────────────────
// ErrorBoundary
// ──────────────────────────────────────────────
class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto mt-12 bg-white rounded-xl border border-red-200 shadow-sm text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-lg font-bold text-slate-900">Errore nel caricamento della Dashboard</h2>
          <p className="text-sm text-slate-500 font-mono">{this.state.message}</p>
          <button
            onClick={() => { localStorage.removeItem('teamflow-data'); window.location.reload() }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
          >
            Reimposta dati e ricarica
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ──────────────────────────────────────────────
// GoalWidget
// ──────────────────────────────────────────────
interface GoalWidgetProps {
  label: string
  current: number
  target: number
  onSetTarget: (n: number) => void
}

function GoalWidget({ label, current, target, onSetTarget }: GoalWidgetProps) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const bar = blockBar(current, target)

  const save = () => {
    const n = parseInt(inputVal, 10)
    if (!isNaN(n) && n > 0) onSetTarget(n)
    setEditing(false)
    setInputVal('')
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
              placeholder="Target"
              className="w-16 px-2 py-0.5 border border-slate-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button onClick={save} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 text-red-500 hover:bg-red-50 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditing(true); setInputVal(String(target || '') ) }}
            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
            title="Modifica obiettivo"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Counter */}
      <div className="text-2xl font-bold text-slate-900 tabular-nums">
        {current} <span className="text-slate-400 font-normal text-base">/ {target > 0 ? target : '—'} task</span>
      </div>

      {/* Block bar */}
      <div className="font-mono text-sm text-indigo-600 tracking-tight leading-none">
        {bar}
      </div>

      {/* Smooth progress bar */}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Percentage */}
      <p className="text-xs font-semibold text-indigo-600 text-right">{pct}%</p>
    </div>
  )
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────
function DashboardInner() {
  const { tasks, members, stats, overdueTasks, getMember, goals, setGoal } = useApp()

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const weekStart = useMemo(() => getWeekStart(todayStr), [todayStr])
  const weekEnd   = useMemo(() => getWeekEnd(weekStart),   [weekStart])

  // Tasks completed today / this week
  const completedToday = useMemo(() =>
    tasks.filter(t => t.status === 'done' && safeDate(t.updatedAt).slice(0, 10) === todayStr).length,
    [tasks, todayStr]
  )

  const completedThisWeek = useMemo(() =>
    tasks.filter(t => {
      if (t.status !== 'done') return false
      const d = safeDate(t.updatedAt).slice(0, 10)
      return d >= weekStart && d <= weekEnd
    }).length,
    [tasks, weekStart, weekEnd]
  )

  // Current goals
  const currentDailyGoal = useMemo(() =>
    goals?.find(g => g.type === 'daily' && safeDate(g.createdAt).slice(0, 10) === todayStr),
    [goals, todayStr]
  )

  const currentWeeklyGoal = useMemo(() =>
    goals?.find(g => g.type === 'weekly' && getWeekStart(safeDate(g.createdAt)) === weekStart),
    [goals, weekStart]
  )

  // Historical goals (past periods only)
  const pastGoals = useMemo(() => {
    return (goals ?? [])
      .filter(g => {
        const d = safeDate(g.createdAt)
        if (g.type === 'daily') return d.slice(0, 10) !== todayStr
        return getWeekStart(d) !== weekStart
      })
      .map(g => {
        const d = safeDate(g.createdAt)
        let completed = 0
        let period = ''
        if (g.type === 'daily') {
          const dateStr = d.slice(0, 10)
          completed = tasks.filter(t => t.status === 'done' && safeDate(t.updatedAt).slice(0, 10) === dateStr).length
          period = formatDate(dateStr)
        } else {
          const ws = getWeekStart(d)
          const we = getWeekEnd(ws)
          completed = tasks.filter(t => {
            if (t.status !== 'done') return false
            const td = safeDate(t.updatedAt).slice(0, 10)
            return td >= ws && td <= we
          }).length
          period = `${formatDate(ws)} – ${formatDate(we)}`
        }
        return { ...g, completed, period, achieved: completed >= g.target }
      })
      .sort((a, b) => new Date(safeDate(b.createdAt)).getTime() - new Date(safeDate(a.createdAt)).getTime())
  }, [goals, tasks, todayStr, weekStart])

  const recentTasks = useMemo(() =>
    [...tasks].sort((a, b) => new Date(safeDate(b.updatedAt)).getTime() - new Date(safeDate(a.updatedAt)).getTime()).slice(0, 5),
    [tasks]
  )

  const memberWorkload = useMemo(() =>
    members.map(m => ({
      member: m,
      active: tasks.filter(t => t.assigneeId === m.id && t.status !== 'done').length,
      done:   tasks.filter(t => t.assigneeId === m.id && t.status === 'done').length,
    })),
    [members, tasks]
  )

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  const statCards = [
    { id: 'total',    label: 'Task totali',           value: stats.total,          icon: TrendingUp,  color: 'text-indigo-600 bg-indigo-50' },
    { id: 'progress', label: 'In corso',              value: stats.inProgress,     icon: Clock,       color: 'text-amber-600 bg-amber-50' },
    { id: 'done',     label: 'Completati',            value: stats.done,           icon: CheckCircle2,color: 'text-emerald-600 bg-emerald-50' },
    { id: 'overdue',  label: 'In ritardo',            value: stats.overdue,        icon: AlertTriangle,color:'text-red-600 bg-red-50' },
    { id: 'review',   label: 'In revisione',          value: stats.inReview,       icon: Clock,       color: 'text-violet-600 bg-violet-50' },
    { id: 'todo',     label: 'Da fare',               value: stats.todo,           icon: Clock,       color: 'text-slate-600 bg-slate-50' },
    { id: 'ontime',   label: 'Completati in tempo',   value: stats.completedOnTime,icon: CheckCircle2,color: 'text-emerald-600 bg-emerald-50' },
    { id: 'late',     label: 'Completati in ritardo', value: stats.completedLate,  icon: AlertTriangle,color:'text-red-600 bg-red-50' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="mb-6 lg:mb-8 hidden lg:block">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Panoramica del team e avanzamento dei task</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        {statCards.map(({ id, label, value, icon: Icon, color }) => (
          <div key={id} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
            <div className={`inline-flex p-1.5 rounded-lg mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Left: recent tasks + overdue */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent tasks */}
          <section className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Task recenti</h2>
              <Link to="/board" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Vai al board <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTasks.map(task => {
                const assignee = getMember(task.assigneeId)
                const style = statusStyles[task.status] ?? { bg: 'bg-slate-100', text: 'text-slate-700' }
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                    {assignee && <MemberAvatar name={assignee.name} color={assignee.color} size="sm" />}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <section className="bg-red-50 rounded-xl border border-red-200">
              <div className="p-4 border-b border-red-100">
                <h2 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Task in ritardo ({overdueTasks.length})
                </h2>
              </div>
              <div className="divide-y divide-red-100">
                {overdueTasks.map(task => {
                  const assignee = getMember(task.assigneeId)
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900">{task.title}</p>
                        <p className="text-xs text-red-600 mt-0.5">Scadenza: {formatDate(task.dueDate)}</p>
                      </div>
                      {assignee && <MemberAvatar name={assignee.name} color={assignee.color} size="sm" />}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* ── GOALS WIDGET ── */}
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-slate-900">Obiettivi</h2>
              <Link to="/goals" className="ml-auto text-xs text-indigo-600 hover:underline">Gestisci →</Link>
            </div>

            <div className="space-y-6">
              {/* Daily */}
              <div>
                <GoalWidget
                  label="Obiettivo oggi"
                  current={completedToday}
                  target={currentDailyGoal?.target ?? 0}
                  onSetTarget={n => setGoal('daily', n)}
                />
              </div>

              {/* Divider */}
              <hr className="border-slate-100" />

              {/* Weekly */}
              <div>
                <GoalWidget
                  label="Obiettivo settimana"
                  current={completedThisWeek}
                  target={currentWeeklyGoal?.target ?? 0}
                  onSetTarget={n => setGoal('weekly', n)}
                />
              </div>
            </div>
          </section>

          {/* ── GOALS HISTORY ── */}
          {pastGoals.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900 mb-3 text-sm">Storico obiettivi</h2>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {pastGoals.map(g => (
                  <div key={g.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 truncate">
                        {g.type === 'daily' ? '📅' : '🗓️'} {g.period}
                      </p>
                      <p className="text-slate-500 mt-0.5">{g.completed} / {g.target} task</p>
                    </div>
                    {g.achieved
                      ? <span className="ml-2 shrink-0 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">✓ Raggiunto</span>
                      : <span className="ml-2 shrink-0 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold text-[10px]">Mancato</span>
                    }
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── OVERALL PROGRESS ── */}
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900 mb-3">Avanzamento generale</h2>
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="text-slate-600">Completamento</span>
              <span className="font-bold text-indigo-600">{completionRate}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </section>

          {/* ── WORKLOAD ── */}
          <section className="bg-white rounded-xl border border-slate-200">
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
                  <div className="text-right text-xs shrink-0">
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

export function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <DashboardInner />
    </DashboardErrorBoundary>
  )
}