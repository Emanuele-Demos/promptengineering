import { useState } from 'react'
import { Target, Trash2 } from 'lucide-react'
import { createGoal, deleteGoal, updateGoal } from '../api/goals.js'
import { useGoalHistory, useGoals } from '../hooks/useGoals'
import type { GoalType } from '../types'
import { GoalProgressCard } from '../components/GoalProgressCard'

const TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'daily', label: 'Giornaliero' },
  { value: 'weekly', label: 'Settimanale' },
]

function formatPeriod(type: GoalType, start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  if (type === 'daily') return s.toLocaleDateString('it-IT', opts)
  return `${s.toLocaleDateString('it-IT', opts)} – ${e.toLocaleDateString('it-IT', opts)}`
}

export function GestioneObiettivi() {
  const { goals, daily, weekly, loading, error, refresh } = useGoals()
  const [historyFilter, setHistoryFilter] = useState<GoalType | undefined>(undefined)
  const { history, loading: historyLoading, refresh: refreshHistory } = useGoalHistory(historyFilter)

  const [type, setType] = useState<GoalType>('daily')
  const [target, setTarget] = useState('5')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSuccess('')
    const parsed = Number(target)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setFormError('Il target deve essere un numero intero maggiore di zero')
      return
    }

    setSubmitting(true)
    try {
      await createGoal({ type, target: parsed })
      setSuccess('Obiettivo salvato con successo')
      setTarget(String(parsed))
      await refresh()
      await refreshHistory()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateTarget = async (id: string, newTarget: number) => {
    setFormError('')
    setSuccess('')
    try {
      await updateGoal(id, { target: newTarget })
      setSuccess('Target aggiornato')
      await refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore imprevisto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo obiettivo?')) return
    try {
      await deleteGoal(id)
      setSuccess('Obiettivo eliminato')
      await refresh()
      await refreshHistory()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore imprevisto')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Obiettivi</h1>
          <p className="text-sm text-slate-500">Imposta e monitora i tuoi obiettivi giornalieri e settimanali.</p>
        </div>
      </div>

      {(error || formError) && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error || formError}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {success}
        </p>
      )}

      <section className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-slate-500 sm:col-span-2">Caricamento obiettivi...</p>
        ) : (
          <>
            {daily ? <GoalProgressCard goal={daily} /> : (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
                Nessun obiettivo giornaliero. Creane uno qui sotto.
              </p>
            )}
            {weekly ? <GoalProgressCard goal={weekly} /> : (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
                Nessun obiettivo settimanale. Creane uno qui sotto.
              </p>
            )}
          </>
        )}
      </section>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Crea o aggiorna obiettivo</h2>
        <p className="text-xs text-slate-500">
          Un solo obiettivo attivo per tipo. Crearne uno nuovo dello stesso tipo aggiorna il target esistente.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as GoalType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Task da completare</label>
            <input
              type="number"
              min={1}
              step={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg"
        >
          {submitting ? 'Salvataggio...' : 'Salva obiettivo'}
        </button>
      </form>

      {goals.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Obiettivi attivi</h2>
          {goals.map((goal) => (
            <div key={goal.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-700 capitalize">{goal.type === 'daily' ? 'Giornaliero' : 'Settimanale'} · target {goal.target}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const val = prompt('Nuovo target:', String(goal.target))
                    if (val) handleUpdateTarget(goal.id, Number(val))
                  }}
                  className="text-xs px-2 py-1 text-indigo-600 hover:bg-white rounded"
                >
                  Modifica target
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(goal.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                  title="Elimina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Storico obiettivi</h2>
          <div className="flex gap-2">
            {([undefined, 'daily', 'weekly'] as const).map((f) => (
              <button
                key={f ?? 'all'}
                type="button"
                onClick={() => setHistoryFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  historyFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f === undefined ? 'Tutti' : f === 'daily' ? 'Giornalieri' : 'Settimanali'}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <p className="text-sm text-slate-500">Caricamento storico...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuno storico disponibile.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-800 capitalize">
                    {item.type === 'daily' ? 'Giornaliero' : 'Settimanale'}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'reached'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.status === 'reached' ? 'Raggiunto' : 'Non raggiunto'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  {formatPeriod(item.type, item.periodStart, item.periodEnd)}
                </p>
                <p className="text-sm text-slate-700">
                  {item.completedTasks} / {item.target} task · {item.completionPercentage}%
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
