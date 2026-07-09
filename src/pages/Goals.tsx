import { useState } from 'react'
import {
  Target,
  Trophy,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Check,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { formatDate } from '../utils/helpers'

const getWeekRange = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1)
  // Usa costruttore senza mutare `d`
  const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday)
  const sunday = new Date(d.getFullYear(), d.getMonth(), diffToMonday + 6)
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  }
}

export function Goals() {
  const { tasks, goals, setGoal } = useApp()
  const [dailyInput, setDailyInput] = useState<string>('')
  const [weeklyInput, setWeeklyInput] = useState<string>('')
  
  const todayStr = new Date().toISOString().slice(0, 10)
  const { start: mondayStr, end: sundayStr } = getWeekRange(todayStr)

  // Current completed: confronta solo la parte data di updatedAt (YYYY-MM-DD)
  const completedTodayTasks = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const doneDate = (typeof t.updatedAt === 'string' ? t.updatedAt : new Date(t.updatedAt).toISOString()).slice(0, 10)
    return doneDate === todayStr
  })
  const completedToday = completedTodayTasks.length

  const completedThisWeekTasks = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const doneDate = (typeof t.updatedAt === 'string' ? t.updatedAt : new Date(t.updatedAt).toISOString()).slice(0, 10)
    return doneDate >= mondayStr && doneDate <= sundayStr
  })
  const completedThisWeek = completedThisWeekTasks.length

  // Current active goals
  const currentDailyGoal = goals?.find(
    (g) => g.type === 'daily' && g.createdAt.slice(0, 10) === todayStr,
  )
  const currentWeeklyGoal = goals?.find(
    (g) => g.type === 'weekly' && getWeekRange(g.createdAt).start === mondayStr,
  )

  const dailyTarget = currentDailyGoal?.target || 0
  const weeklyTarget = currentWeeklyGoal?.target || 0

  // History calculations
  const pastGoals = (goals || [])
    .filter((g) => {
      if (g.type === 'daily') {
        return g.createdAt.slice(0, 10) !== todayStr
      } else {
        return getWeekRange(g.createdAt).start !== mondayStr
      }
    })
    .map((g) => {
      let completed = 0
      let label = ''
      if (g.type === 'daily') {
        const dateStr = g.createdAt.slice(0, 10)
        completed = tasks.filter(
          (t) => t.status === 'done' && t.updatedAt.slice(0, 10) === dateStr,
        ).length
        label = `Giornaliero (${formatDate(dateStr)})`
      } else {
        const { start, end } = getWeekRange(g.createdAt)
        completed = tasks.filter(
          (t) =>
            t.status === 'done' &&
            t.updatedAt.slice(0, 10) >= start &&
            t.updatedAt.slice(0, 10) <= end,
        ).length
        label = `Settimanale (${formatDate(start)} - ${formatDate(end)})`
      }
      return {
        ...g,
        completed,
        label,
        achieved: completed >= g.target,
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Global metrics
  const totalPast = pastGoals.length
  const achievedPast = pastGoals.filter((g) => g.achieved).length
  const successRate = totalPast > 0 ? Math.round((achievedPast / totalPast) * 100) : 0

  const handleSetDaily = (target: number) => {
    setGoal('daily', Math.max(0, target))
    setDailyInput('')
  }

  const handleSetWeekly = (target: number) => {
    setGoal('weekly', Math.max(0, target))
    setWeeklyInput('')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">
      <header className="hidden lg:block">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gestione Obiettivi</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Definisci e monitora gli obiettivi giornalieri e settimanali per il completamento dei task
        </p>
      </header>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{successRate}%</p>
            <p className="text-xs text-slate-500 font-medium">Tasso di Successo Storico</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {achievedPast} <span className="text-sm font-normal text-slate-500">/ {totalPast}</span>
            </p>
            <p className="text-xs text-slate-500 font-medium">Obiettivi Storici Raggiunti</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {completedToday} / {dailyTarget || '—'}
            </p>
            <p className="text-xs text-slate-500 font-medium">Task Completati Oggi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Goal Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Obiettivo Giornaliero</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{formatDate(todayStr)}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Attuale</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{dailyTarget}</span>
                <span className="text-sm text-slate-500">task da completare</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => handleSetDaily(dailyTarget - 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 border-r border-slate-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  placeholder="Target"
                  value={dailyInput}
                  onChange={(e) => setDailyInput(e.target.value)}
                  className="w-16 text-center text-sm font-medium focus:outline-none"
                />
                <button
                  onClick={() => handleSetDaily(dailyTarget + 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 border-l border-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => handleSetDaily(parseInt(dailyInput, 10) || 0)}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Avanzamento</span>
              <span className="font-bold text-indigo-600">
                {completedToday} / {dailyTarget} task&nbsp;(
                {dailyTarget ? Math.min(100, Math.round((completedToday / dailyTarget) * 100)) : 0}%)
              </span>
            </div>
            {/* Barra da sinistra a destra */}
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${dailyTarget ? Math.min(100, Math.round((completedToday / dailyTarget) * 100)) : 0}%`,
                }}
              />
              {dailyTarget > 0 && completedToday > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-normal">
                  {completedToday}/{dailyTarget}
                </span>
              )}
            </div>
            {/* Indicatori singoli task */}
            {dailyTarget > 0 && (
              <div className="flex gap-1">
                {Array.from({ length: Math.min(dailyTarget, 20) }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      i < completedToday ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Task completati oggi ({completedToday})
            </p>
            {completedTodayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nessun task completato oggi</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {completedTodayTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                    <span className="font-medium text-slate-700 truncate flex-1 mr-2">{t.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {t.updatedAt.slice(11, 16)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Goal Goal Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Obiettivo Settimanale</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Questa settimana</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Attuale</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{weeklyTarget}</span>
                <span className="text-sm text-slate-500">task da completare</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => handleSetWeekly(weeklyTarget - 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 border-r border-slate-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  placeholder="Target"
                  value={weeklyInput}
                  onChange={(e) => setWeeklyInput(e.target.value)}
                  className="w-16 text-center text-sm font-medium focus:outline-none"
                />
                <button
                  onClick={() => handleSetWeekly(weeklyTarget + 1)}
                  className="p-2 hover:bg-slate-50 text-slate-600 border-l border-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => handleSetWeekly(parseInt(weeklyInput, 10) || 0)}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Avanzamento</span>
              <span className="font-bold text-indigo-600">
                {completedThisWeek} / {weeklyTarget} task&nbsp;(
                {weeklyTarget ? Math.min(100, Math.round((completedThisWeek / weeklyTarget) * 100)) : 0}%)
              </span>
            </div>
            {/* Barra da sinistra a destra */}
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${weeklyTarget ? Math.min(100, Math.round((completedThisWeek / weeklyTarget) * 100)) : 0}%`,
                }}
              />
              {weeklyTarget > 0 && completedThisWeek > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-normal">
                  {completedThisWeek}/{weeklyTarget}
                </span>
              )}
            </div>
            {/* Indicatori singoli task */}
            {weeklyTarget > 0 && (
              <div className="flex gap-1">
                {Array.from({ length: Math.min(weeklyTarget, 20) }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                      i < completedThisWeek ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Task completati questa settimana ({completedThisWeek})
            </p>
            {completedThisWeekTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nessun task completato questa settimana</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {completedThisWeekTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                    <span className="font-medium text-slate-700 truncate flex-1 mr-2">{t.title}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(t.updatedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Storico degli Obiettivi Raggiunti
        </h2>

        {pastGoals.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Nessuno storico disponibile al momento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="pb-3">Periodo / Tipo</th>
                  <th className="pb-3">Target</th>
                  <th className="pb-3">Completati</th>
                  <th className="pb-3">Risultato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastGoals.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-medium text-slate-700">{g.label}</td>
                    <td className="py-3 text-slate-600">{g.target} task</td>
                    <td className="py-3 text-slate-600">{g.completed} task</td>
                    <td className="py-3">
                      {g.achieved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          Raggiunto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                          Mancato
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
