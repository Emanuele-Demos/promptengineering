import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '../types'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../types'
import { useApp } from '../store/AppContext'

interface TaskModalProps {
  task?: Task | null
  defaultStatus?: TaskStatus
  open: boolean
  onClose: () => void
}

const emptyForm = {
  title: '',
  description: '',
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  assigneeId: '' as string,
  dueDate: '',
  tags: '',
  reminderType: 'none',
  reminderDate: '',
}

const getReminderTypeFromTask = (task: Task) => {
  if (!task.reminderDate) return 'none'
  if (!task.dueDate) return 'custom'
  const due = new Date(task.dueDate).getTime()
  const rem = new Date(task.reminderDate).getTime()
  if (isNaN(due) || isNaN(rem)) return 'custom'
  const diffMin = Math.round((due - rem) / (60 * 1000))
  if (diffMin === 5) return '5m'
  if (diffMin === 30) return '30m'
  if (diffMin === 60) return '1h'
  if (diffMin === 24 * 60) return '1d'
  return 'custom'
}

const calculateReminderDate = (dueDateStr: string, type: string, customDate?: string) => {
  if (type === 'none' || !dueDateStr) return null
  if (type === 'custom') return customDate ? new Date(customDate).toISOString() : null

  const dueDate = new Date(dueDateStr)
  if (isNaN(dueDate.getTime())) return null

  let offsetMinutes = 0
  if (type === '5m') offsetMinutes = 5
  else if (type === '30m') offsetMinutes = 30
  else if (type === '1h') offsetMinutes = 60
  else if (type === '1d') offsetMinutes = 24 * 60

  return new Date(dueDate.getTime() - offsetMinutes * 60 * 1000).toISOString()
}

export function TaskModal({
  task,
  defaultStatus = 'todo',
  open,
  onClose,
}: TaskModalProps) {
  const { members, addTask, updateTask, deleteTask } = useApp()
  const isEditing = !!task

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (task) {
      const rType = getReminderTypeFromTask(task)
      setForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId ?? '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 16) : '',
        tags: task.tags.join(', '),
        reminderType: rType,
        reminderDate: task.reminderDate ? task.reminderDate.slice(0, 16) : '',
      })
    } else {
      setForm({ ...emptyForm, status: defaultStatus })
    }
  }, [task, defaultStatus, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const calculatedReminder = calculateReminderDate(form.dueDate, form.reminderType, form.reminderDate)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate || null,
      reminderDate: calculatedReminder,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    if (isEditing && task) {
      updateTask(task.id, payload)
    } else {
      addTask(payload)
    }
    onClose()
  }

  const handleDelete = () => {
    if (task && confirm('Eliminare questo task?')) {
      deleteTask(task.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Modifica task' : 'Nuovo task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Titolo *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Es. Implementare login utenti"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Dettagli del task..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stato
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TaskStatus })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priorità
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as TaskPriority,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assegnato a
              </label>
              <select
                value={form.assigneeId}
                onChange={(e) =>
                  setForm({ ...form, assigneeId: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Non assegnato</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scadenza
              </label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dueDate: e.target.value,
                    reminderType: e.target.value ? form.reminderType : 'none',
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {form.dueDate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Imposta Promemoria
                </label>
                <select
                  value={form.reminderType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reminderType: e.target.value,
                      reminderDate: e.target.value === 'custom' ? form.reminderDate || form.dueDate : '',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">Nessuno</option>
                  <option value="5m">5 minuti prima della scadenza</option>
                  <option value="30m">30 minuti prima</option>
                  <option value="1h">1 ora prima</option>
                  <option value="1d">1 giorno prima</option>
                  <option value="custom">Personalizzato...</option>
                </select>
              </div>

              {form.reminderType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data e Ora Promemoria
                  </label>
                  <input
                    type="datetime-local"
                    value={form.reminderDate}
                    onChange={(e) => setForm({ ...form, reminderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tag
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="backend, urgent (separati da virgola)"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4" />
                Elimina
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                {isEditing ? 'Salva' : 'Crea task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
