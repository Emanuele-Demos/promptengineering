import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'

export function GoalHistoryPage() {
  const { goalHistory, loadGoals } = useApp()
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all')

  useEffect(() => {
    void loadGoals()
  }, [loadGoals])

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return goalHistory
    return goalHistory.filter((entry) => entry.type === filter)
  }, [filter, goalHistory])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Storico</p>
        <h1 className="text-2xl font-bold text-slate-900">Storico obiettivi</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Filtra</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'daily' | 'weekly')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="all">Tutti</option>
            <option value="daily">Giornalieri</option>
            <option value="weekly">Settimanali</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Task completati</th>
                <th className="px-3 py-2">Percentuale</th>
                <th className="px-3 py-2">Stato</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{new Date(entry.createdAt).toLocaleDateString('it-IT')}</td>
                  <td className="px-3 py-3">{entry.type === 'daily' ? 'Giornaliero' : 'Settimanale'}</td>
                  <td className="px-3 py-3">{entry.target}</td>
                  <td className="px-3 py-3">{entry.completed}</td>
                  <td className="px-3 py-3">{entry.percentage}%</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.achieved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {entry.achieved ? 'Raggiunto' : 'Non raggiunto'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
