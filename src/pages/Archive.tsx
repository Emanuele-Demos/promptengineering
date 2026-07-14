import { useState } from 'react'
import { RotateCcw, Search, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'

function formatMinutes(minutes?: number | null) {
  if (!minutes) return 'Nessuna stima'
  if (minutes >= 2400 && minutes % 2400 === 0) return `${minutes / 2400} settimane`
  if (minutes >= 480 && minutes % 480 === 0) return `${minutes / 480} giorni`
  if (minutes >= 60) return `${Math.round((minutes / 60) * 10) / 10} ore`
  return `${minutes} minuti`
}

export function Archive() {
  const { archivedTasks, restoreTask, permanentlyDeleteTask, getProject } = useApp()
  const [search, setSearch] = useState('')

  const filteredTasks = archivedTasks.filter((task) => {
    const query = search.toLowerCase()
    return (
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Archivio</h1>
          <p className="text-sm text-slate-500 mt-1">
            Task completati o non più necessari, esclusi dalla Board principale
          </p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nell'archivio..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </header>

      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const project = getProject(task.projectId)

          return (
            <article key={task.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900">{task.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    {project && (
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                        {project.name}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {formatMinutes(task.estimatedTime)}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => restoreTask(task.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Ripristina
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Eliminare definitivamente questo task?')) {
                        permanentlyDeleteTask(task.id)
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina definitivamente
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Nessun task archiviato
          </div>
        )}
      </div>
    </div>
  )
}
