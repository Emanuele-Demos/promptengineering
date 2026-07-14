import { RotateCcw, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function Archive() {
  const { tasks, restoreTask, deleteTask } = useApp()
  const archivedTasks = tasks.filter((task) => task.archived)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Archivio</h1>
        <p className="text-sm text-slate-500 mt-1">Recupera o elimina definitivamente i task archiviati.</p>
      </header>

      <div className="space-y-3">
        {archivedTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">Nessun task archiviato.</div>
        ) : archivedTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">{task.title}</h2>
              <p className="text-sm text-slate-500">{task.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => restoreTask(task.id)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg">
                <RotateCcw className="w-4 h-4" /> Ripristina
              </button>
              <button onClick={() => deleteTask(task.id)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" /> Elimina
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
