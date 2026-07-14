import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useCategories } from '../hooks/useCategories'
import { useProjects } from '../hooks/useProjects'
import { CategoryBadge } from '../components/CategoryBadge'
import { PriorityBadge } from '../components/PriorityBadge'
import { STATUS_LABELS, type TaskStatus } from '../types'
import { formatDate, statusStyles } from '../utils/helpers'

const PAGE_SIZE = 15
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

export function Archivio() {
  const { archivedTasks, restoreTask, deleteTaskPermanently } = useApp()
  const { categories, loading: categoriesLoading, getCategoryById } = useCategories()
  const { projects, loading: projectsLoading, getProjectById } = useProjects()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [archivedFrom, setArchivedFrom] = useState('')
  const [archivedTo, setArchivedTo] = useState('')
  const [page, setPage] = useState(1)
  const [success, setSuccess] = useState('')

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(''), 3000)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return archivedTasks.filter((task) => {
      const category = getCategoryById(task.categoryId)
      const project = getProjectById(task.projectId)

      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        (category?.name.toLowerCase().includes(q) ?? false) ||
        (project?.name.toLowerCase().includes(q) ?? false)

      const matchesCategory =
        !categoryFilter || (task.categoryId ?? null) === categoryFilter

      const matchesProject =
        !projectFilter || (task.projectId ?? null) === projectFilter

      const matchesStatus = !statusFilter || task.status === statusFilter

      const archivedDate = (task.archivedAt ?? task.updatedAt).slice(0, 10)
      const matchesFrom = !archivedFrom || archivedDate >= archivedFrom
      const matchesTo = !archivedTo || archivedDate <= archivedTo

      return (
        matchesSearch &&
        matchesCategory &&
        matchesProject &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      )
    })
  }, [
    archivedTasks,
    search,
    categoryFilter,
    projectFilter,
    statusFilter,
    archivedFrom,
    archivedTo,
    getCategoryById,
    getProjectById,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const handleRestore = (id: string, title: string) => {
    restoreTask(id)
    showSuccess(`"${title}" ripristinato con successo`)
  }

  const handleDelete = (id: string, title: string) => {
    if (
      !confirm(
        `Eliminare definitivamente "${title}"?\n\nQuesta operazione non può essere annullata.`,
      )
    ) {
      return
    }
    deleteTaskPermanently(id)
    showSuccess('Task eliminato definitivamente')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Archive className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Archivio</h1>
            <p className="text-sm text-slate-500">
              Task archiviati — consultabili e ripristinabili in qualsiasi momento
            </p>
          </div>
        </div>
      </header>

      {success && (
        <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {success}
        </p>
      )}

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Cerca per titolo, descrizione, categoria o progetto..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            disabled={categoriesLoading}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtra per categoria"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value)
              setPage(1)
            }}
            disabled={projectsLoading}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtra per progetto"
          >
            <option value="">Tutti i progetti</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtra per stato"
          >
            <option value="">Tutti gli stati</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={archivedFrom}
            onChange={(e) => {
              setArchivedFrom(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Archiviato dal"
            title="Archiviato dal"
          />
          <input
            type="date"
            value={archivedTo}
            onChange={(e) => {
              setArchivedTo(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Archiviato fino al"
            title="Archiviato fino al"
          />
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        {filtered.length} task archiviat{filtered.length === 1 ? 'o' : 'i'}
      </p>

      {paginated.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Nessun task archiviato</p>
          <p className="text-xs text-slate-400 mt-1">
            I task archiviati dalla board compariranno qui
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {paginated.map((task) => {
            const category = getCategoryById(task.categoryId)
            const project = getProjectById(task.projectId)
            const style = statusStyles[task.status]
            const completedAt = task.status === 'done' ? task.updatedAt : null

            return (
              <li
                key={task.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold uppercase tracking-wide">
                        Archiviato
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      {category && <CategoryBadge category={category} />}
                      {project && (
                        <span className="text-slate-500">📁 {project.name}</span>
                      )}
                      <span>
                        Archiviato: {formatDate((task.archivedAt ?? task.updatedAt).slice(0, 10))}
                      </span>
                      {completedAt && (
                        <span>Completato: {formatDate(completedAt.slice(0, 10))}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestore(task.id, task.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      Ripristina
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id, task.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Elimina
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            aria-label="Pagina precedente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-600">
            Pagina {currentPage} di {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            aria-label="Pagina successiva"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
