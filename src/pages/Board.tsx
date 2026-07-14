import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import { useApp } from '../store/AppContext'
import { KanbanColumn } from '../components/KanbanColumn'
import { TaskModal } from '../components/TaskModal'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

function formatMinutes(minutes: number) {
  if (minutes >= 2400 && minutes % 2400 === 0) return `${minutes / 2400} settimane`
  if (minutes >= 480 && minutes % 480 === 0) return `${minutes / 480} giorni`
  if (minutes >= 60) return `${Math.round((minutes / 60) * 10) / 10} ore`
  return `${minutes} minuti`
}

export function Board() {
  const { tasks, categories, projects, moveTask } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [sortByEstimate, setSortByEstimate] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const filteredTasks = tasks
    .filter(
      (t) =>
        (categoryFilter === '' || t.categoryId === categoryFilter) &&
        (projectFilter === '' || t.projectId === projectFilter) &&
        (t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))),
    )
    .sort((a, b) => {
      if (!sortByEstimate) return 0
      return (a.estimatedTime ?? Number.MAX_SAFE_INTEGER) - (b.estimatedTime ?? Number.MAX_SAFE_INTEGER)
    })

  const totalOpenEstimate = filteredTasks
    .filter((task) => task.status !== 'done')
    .reduce((total, task) => total + (task.estimatedTime ?? 0), 0)

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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tutti i progetti</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortByEstimate((value) => !value)}
            className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
              sortByEstimate
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
            }`}
          >
            Tempo stimato
          </button>
          <button
            onClick={() => openCreate('todo')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:inline">Nuovo task</span>
          </button>
        </div>
        <div className="text-sm text-slate-500">
          Totale stimato task aperti: <span className="font-semibold text-slate-700">{formatMinutes(totalOpenEstimate)}</span>
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
