import { useMemo } from 'react'
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

// Importiamo i componenti grafici di Recharts
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

// Palette colori coordinata per i grafici
const COLORI_CATEGORIE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6']
const MAPPATURA_COLORI_PRIORITA = {
  'Urgente': '#ef4444',
  'Alta': '#f97316',
  'Media': '#eab308',
  'Bassa': '#10b981',
  'Urgent': '#ef4444',
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#10b981'
}

export function Dashboard() {
  const { tasks, members, stats, overdueTasks, getMember, statistics, loading } = useApp()

  const metricheElementi = useMemo(() => {
    const summary = statistics ?? {
      completedToday: 0,
      completedWeek: 0,
      completedMonth: 0,
      overdueTasks: overdueTasks.length,
      openTasks: tasks.filter((task) => task.status !== 'done').length,
      averageCompletionTime: 0,
      weeklyTrend: [],
      monthlyCompletions: [],
      tasksByCategory: [],
      tasksByPriority: [],
    }

    const tempoMedioStr = summary.averageCompletionTime > 24
      ? `${(summary.averageCompletionTime / 24).toFixed(1)} giorni`
      : `${summary.averageCompletionTime.toFixed(0)} ore`

    return {
      completatiOggi: summary.completedToday,
      completatiSettimana: summary.completedWeek,
      completatiMese: summary.completedMonth,
      inRitardo: summary.overdueTasks,
      aperti: summary.openTasks,
      tempoMedioStr,
      andamentoSettimanale: summary.weeklyTrend.map((entry) => ({ name: entry.day, task: entry.completed })),
      completamentiMensili: summary.monthlyCompletions.map((entry) => ({ name: entry.month, task: entry.completed })),
      taskPerCategoria: summary.tasksByCategory.map((entry) => ({ name: entry.category, value: entry.count })),
      taskPerPriorita: summary.tasksByPriority.map((entry) => ({ name: entry.priority, value: entry.count })),
    }
  }, [statistics, overdueTasks, tasks])

  // Codice preesistente per i task recenti e il carico di lavoro
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const memberWorkload = members.map((m) => ({
    member: m,
    active: tasks.filter((t) => t.assigneeId === m.id && t.status !== 'done').length,
    done: tasks.filter((t) => t.assigneeId === m.id && t.status === 'done').length,
  }))

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  // Configurazione dei 6 indicatori precisi richiesti dal professore
  const statCards = [
    { label: 'Task completati oggi', value: metricheElementi.completatiOggi, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Task completati questa settimana', value: metricheElementi.completatiSettimana, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Task completati questo mese', value: metricheElementi.completatiMese, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Task in ritardo', value: metricheElementi.inRitardo, icon: AlertTriangle, color: metricheElementi.inRitardo > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50' },
    { label: 'Task aperti', value: metricheElementi.aperti, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Tempo medio di completamento', value: metricheElementi.tempoMedioStr, icon: Clock, color: 'text-teal-600 bg-teal-50' },
  ]

  const hasChartsData = metricheElementi.andamentoSettimanale.some((entry) => entry.task > 0) || metricheElementi.completamentiMensili.some((entry) => entry.task > 0) || metricheElementi.taskPerCategoria.length > 0 || metricheElementi.taskPerPriorita.length > 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      
      {/* INTESTAZIONE */}
      <header className="hidden lg:block">
        <h1 className="text-2xl font-bold text-slate-900">Statistiche e Produttività</h1>
        <p className="text-sm text-slate-500 mt-1">
          Dashboard con statistiche relative all'attività dell'utente e del team.
        </p>
      </header>

      {/* SEZIONE 1: I 6 CONTATORI RICHIESTI */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Caricamento statistiche…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? null : !hasChartsData ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Nessun dato disponibile. Creare o completare dei task per vedere le statistiche.
        </div>
      ) : null}

      {/* STRUTTURA ESISTENTE (Task recenti, Avanzamento, Carico di lavoro) */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Task recenti</h2>
              <Link to="/board" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Vai al board <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTasks.map((task) => {
                const assignee = getMember(task.assigneeId)
                const style = statusStyles[task.status] || { bg: 'bg-slate-100', text: 'text-slate-700' }
                return (
                  <div key={task.id} className="flex items-start sm:items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                          {STATUS_LABELS[task.status] || task.status}
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

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Avanzamento</h2>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Completamento</span>
                <span className="text-sm font-bold text-indigo-600">{completionRate}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
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

      {/* SEZIONE 2: I 4 GRAFICI INTERATTIVI RICHIESTI DALL'ESERCIZIO */}
      {!loading && hasChartsData ? (
        <div className="pt-6 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Grafici Analitici di Rendimento
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Andamento Settimanale */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Andamento settimanale</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricheElementi.andamentoSettimanale}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="task" name="Task completati" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Completamenti Mensili */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Completamenti mensili</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricheElementi.completamentiMensili}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="task" name="Task completati" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Task per Categoria */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 w-full text-left">Task per categoria</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metricheElementi.taskPerCategoria} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                      {metricheElementi.taskPerCategoria.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORI_CATEGORIE[index % COLORI_CATEGORIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Task per Priorità */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 w-full text-left">Task per priorità</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metricheElementi.taskPerPriorita} cx="50%" cy="50%" outerRadius={80} label fontSize={11} dataKey="value">
                      {metricheElementi.taskPerPriorita.map((entry, index) => {
                        const colorePrio = MAPPATURA_COLORI_PRIORITA[entry.name as keyof typeof MAPPATURA_COLORI_PRIORITA] || '#64748b'
                        return <Cell key={`cell-${index}`} fill={colorePrio} />
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}