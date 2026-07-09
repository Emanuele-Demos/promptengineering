import { Plus, Pencil, Trash2, Calendar, ClipboardList, GripVertical } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { TaskModal } from '../components/TaskModal'
import { PriorityBadge } from '../components/PriorityBadge'
import { MemberAvatar } from '../components/MemberAvatar'
import { formatDate } from '../utils/helpers'
import { STATUS_LABELS } from '../types'
import type { Task } from '../types'

const CATEGORY_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
]

import { useState } from 'react'

export function Categories() {
  const { categories, tasks, addCategory, updateCategory, deleteCategory, getMember, dragReorderTasks } = useApp()
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])

  // State for editing task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setName('')
    setColor(CATEGORY_COLORS[0])
    setShowForm(true)
  }

  const openEdit = (category: { id: string; name: string; color: string }) => {
    setEditingId(category.id)
    setName(category.name)
    setColor(category.color)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (editingId) {
      updateCategory(editingId, name.trim(), color)
    } else {
      addCategory(name.trim(), color)
    }
    setShowForm(false)
    setName('')
    setEditingId(null)
  }

  const handleDelete = (id: string, catName: string) => {
    const associatedTasks = tasks.filter((t) => t.categoryId === id).length
    const msg =
      associatedTasks > 0
        ? `Ci sono ${associatedTasks} task associati a questa categoria. Verranno dissociati. Vuoi procedere con l'eliminazione di "${catName}"?`
        : `Eliminare la categoria "${catName}"?`
    if (confirm(msg)) {
      deleteCategory(id)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Categorie</h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              Visualizza i task suddivisi per categoria e gestisci le categorie
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors justify-center"
          >
            <Plus className="w-4 h-4" />
            Aggiungi categoria
          </button>
        </div>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900">
            {editingId ? 'Modifica categoria' : 'Nuova categoria'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome Categoria
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Sviluppo, Marketing, Personale"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Seleziona Colore
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c
                        ? 'border-slate-900 scale-110 shadow-sm'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {editingId ? 'Salva' : 'Aggiungi'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {categories.map((category) => {
          const catTasksList = tasks.filter((t) => t.categoryId === category.id)
          return (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4.5 h-4.5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-base truncate">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {catTasksList.length} {catTasksList.length === 1 ? 'task associato' : 'task associati'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(category)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Modifica Categoria"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Elimina Categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task List under Category */}
              <div className="divide-y divide-slate-100">
                {catTasksList.length > 0 ? (
                  catTasksList.map((task) => {
                    const assignee = getMember(task.assigneeId)
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          setDraggingTaskId(task.id)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                        }}
                        onDragEnd={() => {
                          setDraggingTaskId(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (draggingTaskId && draggingTaskId !== task.id) {
                            const draggedTask = tasks.find((t) => t.id === draggingTaskId)
                            if (draggedTask && draggedTask.categoryId === task.categoryId) {
                              dragReorderTasks(draggingTaskId, task.id)
                            }
                          }
                          setDraggingTaskId(null)
                        }}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50 cursor-grab active:cursor-grabbing transition-colors ${
                          draggingTaskId === task.id ? 'opacity-40 bg-slate-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <GripVertical className="w-4 h-4 text-slate-400 shrink-0 cursor-grab" />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors truncate">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-1 truncate max-w-xl">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                         <div className="flex flex-wrap items-center gap-3 shrink-0">

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border border-current`}
                            style={{
                              color:
                                task.status === 'done'
                                  ? '#10b981'
                                  : task.status === 'in_progress'
                                  ? '#6366f1'
                                  : task.status === 'review'
                                  ? '#8b5cf6'
                                  : '#64748b',
                              backgroundColor:
                                task.status === 'done'
                                  ? '#f0fdf4'
                                  : task.status === 'in_progress'
                                  ? '#eef2ff'
                                  : task.status === 'review'
                                  ? '#f5f3ff'
                                  : '#f8fafc',
                            }}
                          >
                            {STATUS_LABELS[task.status]}
                          </span>

                          {/* Priority Badge */}
                          <PriorityBadge priority={task.priority} />

                          {/* Due Date */}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}

                          {/* Assignee Avatar */}
                          {assignee ? (
                            <div className="flex items-center gap-1.5 bg-slate-100 pr-2 pl-1 py-0.5 rounded-full">
                              <MemberAvatar
                                name={assignee.name}
                                color={assignee.color}
                                size="sm"
                              />
                              <span className="text-xs font-medium text-slate-700">
                                {assignee.name.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Non assegnato</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 gap-2">
                    <ClipboardList className="w-8 h-8 text-slate-300" />
                    <p className="text-sm">Nessun task in questa categoria</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskModal
        open={modalOpen}
        task={selectedTask}
        onClose={() => {
          setModalOpen(false)
          setSelectedTask(null)
        }}
      />
    </div>
  )
}