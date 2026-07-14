import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import { useApp } from '../store/AppContext'
import { useCategories } from '../hooks/useCategories'
import { KanbanColumn } from '../components/KanbanColumn'
import { TaskModal } from '../components/TaskModal'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

export function Board() {
  const { tasks, moveTask } = useApp()
  const { categories, loading: categoriesLoading, getCategoryById } = useCategories()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorites'>('all')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const filteredTasks = tasks
    .filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

      const matchesCategory =
        !categoryFilter || (t.categoryId ?? null) === categoryFilter

      const matchesFavorite =
        favoriteFilter === 'favorites' ? Boolean(t.favorite) : true

      return matchesSearch && matchesCategory && matchesFavorite
    })
    .sort((a, b) => {
      if (favoriteFilter === 'favorites') return 0
      if (Boolean(a.favorite) === Boolean(b.favorite)) return 0
      return a.favorite ? -1 : 1
    })

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 mb-4 sm:mb-6">
        <div className="hidden lg:block">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Board Kanban</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Trascina i task tra le colonne per aggiornare lo stato
          </p>
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
