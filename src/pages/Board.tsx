import { useState } from 'react'
import { Clock3, Plus, Search } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import { useApp } from '../store/AppContext'
import { KanbanColumn } from '../components/KanbanColumn'
import { TaskModal } from '../components/TaskModal'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

export function Board() {
  const { tasks, moveTask } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [search, setSearch] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showEstimatedOnly, setShowEstimatedOnly] = useState(false)

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

    const matchesEstimated = !showEstimatedOnly || Boolean(t.estimatedTime?.trim())

    return matchesSearch && matchesEstimated
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
    <div className="p-6">
      <header className="flex flex-col gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Board Kanban</h1>
          <p className="text-base text-slate-500 mt-1">Trascina i task tra le colonne per aggiornare lo stato</p>
        </div>
        <div className="flex flex-row items-center gap-3">
          <div className="relative flex-1 min-w-0 max-w-[56%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca task..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setShowEstimatedOnly((prev) => !prev)}
              className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showEstimatedOnly
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock3 className="w-4 h-4" />
              <span>Tempo stimato</span>
            </button>
            <button
              onClick={() => openCreate('todo')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo task</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-2 pr-6 scrollbar-thin">
        <div className="flex min-w-max gap-3">
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
