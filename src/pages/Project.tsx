import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit2, Plus, Search, Folder } from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { Task, TaskStatus } from '../types'
import { KanbanColumn } from '../components/KanbanColumn'
import { TaskModal } from '../components/TaskModal'
import { ProjectModal } from '../components/ProjectModal'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

export function Project() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getProject, tasks, moveTask } = useApp()
  
  const project = getProject(id || null)

  const [modalOpen, setModalOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [search, setSearch] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Redirect to dashboard if project not found
  if (!project && id) {
    return (
      <div className="p-8 text-center">
        <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Progetto non trovato</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Torna alla Dashboard
        </button>
      </div>
    )
  }

  if (!project) return null

  const projectTasks = tasks.filter((t) => t.projectId === project.id)
  
  const filteredTasks = projectTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
  )

  const completedTasks = projectTasks.filter((t) => t.status === 'done').length
  const totalTasks = projectTasks.length
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

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
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <button
              onClick={() => setProjectModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Modifica Progetto"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          {project.description && (
            <p className="text-slate-500 mt-1">{project.description}</p>
          )}
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">Avanzamento</span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-slate-500">
              {completedTasks} di {totalTasks} task completati
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
          <div className="relative flex-1 min-w-0 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca nei task del progetto..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
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
          />
        ))}
      </div>

      <TaskModal
        task={selectedTask}
        defaultStatus={defaultStatus}
        defaultProjectId={project.id}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTask(null)
        }}
      />
      <ProjectModal
        project={project}
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />
    </div>
  )
}
