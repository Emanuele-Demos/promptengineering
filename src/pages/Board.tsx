import { useMemo, useEffect, useState } from 'react'
import { Plus, Search, Timer } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import type { Task, TaskPriority, TaskStatus } from '../types'
import { useApp } from '../store/AppContext'
import { useCategories } from '../hooks/useCategories'
import { KanbanColumn } from '../components/KanbanColumn'
import { TaskModal } from '../components/TaskModal'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

type SortField = 'default' | 'priority' | 'dueDate' | 'estimatedTime'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function sortTasks(tasks: Task[], sortBy: SortField, sortDir: SortDir, favoritesFirst: boolean) {
  const dir = sortDir === 'asc' ? 1 : -1

  return [...tasks].sort((a, b) => {
    if (sortBy === 'default' && favoritesFirst) {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) {
        return a.favorite ? -1 : 1
      }
      return 0
    }

    if (sortBy === 'priority') {
      const diff =
        (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0)
      return dir * diff
    }

    if (sortBy === 'dueDate') {
      const ad = a.dueDate ?? (sortDir === 'asc' ? '9999-12-31' : '')
      const bd = b.dueDate ?? (sortDir === 'asc' ? '9999-12-31' : '')
      return dir * ad.localeCompare(bd)
    }

    if (sortBy === 'estimatedTime') {
      const missing = sortDir === 'asc' ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER
      const ae = a.estimatedTime ?? missing
      const be = b.estimatedTime ?? missing
      return dir * (ae - be)
    }

    return 0
  })
}

export function Board() {
  const { tasks, moveTask, archiveTask, stats } = useApp()
  const location = useLocation()
  const { categories, loading: categoriesLoading, getCategoryById } = useCategories()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorites'>('all')
  const [sortBy, setSortBy] = useState<SortField>('default')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const openTaskId = (location.state as { openTaskId?: string } | null)?.openTaskId
    if (!openTaskId) return

    const task = tasks.find((t) => t.id === openTaskId)
    if (task) {
      setSelectedTask(task)
      setModalOpen(true)
    }
    window.history.replaceState({}, document.title)
  }, [location.state, tasks])

  const activeTasks = tasks.filter((t) => !t.archived)

  const filteredTasks = useMemo(
    () =>
      sortTasks(
        activeTasks.filter((t) => {
          const matchesSearch =
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

          const matchesCategory =
            !categoryFilter || (t.categoryId ?? null) === categoryFilter

          const matchesFavorite =
            favoriteFilter === 'favorites' ? Boolean(t.favorite) : true

          return matchesSearch && matchesCategory && matchesFavorite
        }),
        sortBy,
        sortDir,
        favoriteFilter === 'all' && sortBy === 'default',
      ),
    [activeTasks, search, categoryFilter, favoriteFilter, sortBy, sortDir],
  )

  const openCreate = (status: TaskStatus) => {
    setSelectedTask(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleDrop = (status: TaskStatus) => {
    if (draggingId) {
      moveTask(draggingId, status)
      setDraggingId(null)
    }
  }

  const handleArchive = (taskId: string) => {
    archiveTask(taskId)
    setSuccess('Task archiviato con successo')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {success && (
        <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {success}
        </p>
      )}
      <header className="flex flex-col gap-4 mb-4 sm:mb-6">
        <div className="hidden lg:block">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Board Kanban</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Trascina i task tra le colonne per aggiornare lo stato
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-100">
            <Timer className="w-4 h-4 shrink-0" />
            <span>
              Tempo totale stimato:{' '}
              <strong>{stats.totalEstimatedFormatted}</strong>
              {stats.openTasksWithEstimate > 0 && (
                <>
                  {' '}
                  su <strong>{stats.openTasksWithEstimate}</strong> task
                </>
              )}
            </span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Ordina per"
          >
            <option value="default">Ordina: predefinito</option>
            <option value="priority">Ordina: priorità</option>
            <option value="dueDate">Ordina: scadenza</option>
            <option value="estimatedTime">Ordina: tempo stimato</option>
          </select>
          {sortBy !== 'default' && (
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Direzione ordinamento"
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca task..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={favoriteFilter}
            onChange={(e) => setFavoriteFilter(e.target.value as 'all' | 'favorites')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[10rem]"
            aria-label="Filtra preferiti"
          >
            <option value="all">Tutti i task</option>
            <option value="favorites">Solo preferiti</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={categoriesLoading}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[10rem]"
            aria-label="Filtra per categoria"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => openCreate('todo')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:inline">Nuovo task</span>
          </button>
        </div>
      </header>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-thin">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={filteredTasks.filter((t) => t.status === status)}
            onTaskClick={openEdit}
            onAddTask={openCreate}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            draggingId={draggingId}
            onDragStart={setDraggingId}
            getCategoryById={getCategoryById}
            onArchive={handleArchive}
          />
        ))}
      </div>

      <TaskModal
        task={selectedTask}
        defaultStatus={defaultStatus}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTask(null)
        }}
      />
    </div>
  )
}
