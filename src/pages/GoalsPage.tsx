import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function GoalsPage() {
  const { goalsProgress, createGoal, updateGoal, deleteGoal, loadGoals } = useApp()
  const [type, setType] = useState<'daily' | 'weekly'>('daily')
  const [target, setTarget] = useState('5')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTarget, setEditingTarget] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  const dailyGoal = useMemo(() => goalsProgress.find((goal) => goal.type === 'daily'), [goalsProgress])
  const weeklyGoal = useMemo(() => goalsProgress.find((goal) => goal.type === 'weekly'), [goalsProgress])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createGoal({ type, target: Number(target) })
    setTarget('5')
    setMessage('Obiettivo creato')
  }

  const handleEdit = async (id: string, typeValue: 'daily' | 'weekly') => {
    await updateGoal(id, Number(editingTarget), typeValue)
    setEditingId(null)
    setMessage('Obiettivo aggiornato')
  }

  const handleDelete = async (id: string) => {
    await deleteGoal(id)
    setMessage('Obiettivo eliminato')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Obiettivi</p>
          <h1 className="text-2xl font-bold text-slate-900">Obiettivi giornalieri e settimanali</h1>
        </div>
      </div>

      {message ? <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {['daily', 'weekly'].map((goalType) => {
          const progress = goalType === 'daily' ? dailyGoal : weeklyGoal
          const label = goalType === 'daily' ? 'Obiettivo di oggi' : 'Obiettivo della settimana'
          const percentage = progress?.percentage ?? 0
          const completed = progress?.completed ?? 0
          const target = progress?.target ?? 0

          return (
            <div key={goalType} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
                {progress ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${progress.achieved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {progress.achieved ? 'Raggiunto' : 'In corso'}
                  </span>
                ) : null}
              </div>

              {progress ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-slate-900">{completed}</p>
                      <p className="text-sm text-slate-500">/{target} task</p>
                    </div>
                    <p className="text-2xl font-semibold text-indigo-600">{percentage}%</p>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, percentage)}%` }} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId(progress.goalId)
                        setEditingTarget(String(progress.target))
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Modifica obiettivo
                    </button>
                    <button
                      onClick={() => void handleDelete(progress.goalId)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Elimina
                    </button>
                  </div>

                  {editingId === progress.goalId ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={editingTarget}
                        onChange={(e) => setEditingTarget(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button onClick={() => void handleEdit(progress.goalId, progress.type)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Salva</button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                  <p className="mb-3">Nessun obiettivo impostato.</p>
                  <button
                    onClick={() => setType(goalType as 'daily' | 'weekly')}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Crea obiettivo
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Nuovo obiettivo</h2>
          <button onClick={() => void loadGoals()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
            Aggiorna
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'daily' | 'weekly')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="daily">Giornaliero</option>
              <option value="weekly">Settimanale</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Numero di task</label>
            <input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Salva</button>
          </div>
        </form>
      </div>
    </div>
  )
}
