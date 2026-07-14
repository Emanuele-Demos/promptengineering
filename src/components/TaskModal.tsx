import { useEffect, useState } from 'react'
import { Bell, X, Trash2 } from 'lucide-react'
import type { Attachment, RepeatType, Task, TaskPriority, TaskStatus } from '../types'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../types'
import { useApp } from '../store/AppContext'
import { AttachmentUploader } from './AttachmentUploader'

interface TaskModalProps {
  task?: Task | null
  defaultStatus?: TaskStatus
  open: boolean
  onClose: () => void
}

const emptyForm = {
  title: '',
  description: '',
  notes: '',
  links: '',
  attachments: [] as Attachment[],
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  assigneeId: '' as string,
  categoryId: '' as string,
  projectId: '' as string,
  dueDate: '',
  estimatedTimeValue: '',
  estimatedTimeUnit: 'hours',
  reminderOption: '',
  customReminderDate: '',
  isRecurring: false,
  repeatType: 'weekly' as RepeatType,
  repeatEvery: '1',
  repeatEnd: '',
  repeatDays: [] as number[],
  repeatMaxOccurrences: '',
  repeatStopped: false,
  tags: '',
}

function estimatedToMinutes(value: string, unit: string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  if (unit === 'minutes') return Math.round(numeric)
  if (unit === 'hours') return Math.round(numeric * 60)
  if (unit === 'days') return Math.round(numeric * 60 * 8)
  if (unit === 'weeks') return Math.round(numeric * 60 * 8 * 5)
  return Math.round(numeric)
}

function splitEstimatedTime(minutes: number | null | undefined) {
  if (!minutes) return { value: '', unit: 'hours' }
  if (minutes % 2400 === 0) return { value: String(minutes / 2400), unit: 'weeks' }
  if (minutes % 480 === 0) return { value: String(minutes / 480), unit: 'days' }
  if (minutes % 60 === 0) return { value: String(minutes / 60), unit: 'hours' }
  return { value: String(minutes), unit: 'minutes' }
}

const REMINDER_OPTIONS = [
  { value: '5', label: '5 minuti prima' },
  { value: '30', label: '30 minuti prima' },
  { value: '60', label: '1 ora prima' },
  { value: '1440', label: '1 giorno prima' },
  { value: 'custom', label: 'Personalizzato' },
]

const REPEAT_OPTIONS = [
  { value: 'daily', label: 'Ogni giorno' },
  { value: 'weekly', label: 'Ogni settimana' },
  { value: 'monthly', label: 'Ogni mese' },
  { value: 'yearly', label: 'Ogni anno' },
  { value: 'custom', label: 'Personalizzata' },
]

const WEEK_DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Gio' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function toIsoFromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null
}

function buildReminderDate(dueDate: string, option: string, customReminderDate: string) {
  if (!option) return null
  if (option === 'custom') return toIsoFromDateTimeLocal(customReminderDate)
  if (!dueDate) return null

  const dueAt = new Date(`${dueDate}T09:00:00`)
  dueAt.setMinutes(dueAt.getMinutes() - Number(option))
  return dueAt.toISOString()
}

export function TaskModal({
  task,
  defaultStatus = 'todo',
  open,
  onClose,
}: TaskModalProps) {
  const {
    members,
    categories,
    projects,
    addTask,
    updateTask,
    deleteTask,
    archiveTask,
    uploadTaskAttachments,
    deleteAttachment,
  } = useApp()
  const isEditing = !!task

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        notes: task.notes,
        links: task.links.join(', '),
        attachments: task.attachments,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId ?? '',
        categoryId: task.categoryId ?? '',
        projectId: task.projectId ?? '',
        dueDate: task.dueDate ?? '',
        estimatedTimeValue: splitEstimatedTime(task.estimatedTime).value,
        estimatedTimeUnit: splitEstimatedTime(task.estimatedTime).unit,
        reminderOption: task.reminderDate ? 'custom' : '',
        customReminderDate: toDateTimeLocal(task.reminderDate),
        isRecurring: !!task.repeatType && task.repeatType !== 'none',
        repeatType: task.repeatType && task.repeatType !== 'none' ? task.repeatType : 'weekly',
        repeatEvery: String(task.repeatEvery ?? 1),
        repeatEnd: task.repeatEnd ?? '',
        repeatDays: task.repeatDays ?? [],
        repeatMaxOccurrences: task.repeatMaxOccurrences ? String(task.repeatMaxOccurrences) : '',
        repeatStopped: !!task.repeatStopped,
        tags: task.tags.join(', '),
      })
    } else {
      setForm({ ...emptyForm, status: defaultStatus })
    }
  }, [task, defaultStatus, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      links: form.links
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      attachments: form.attachments,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      categoryId: form.categoryId || null,
      projectId: form.projectId || null,
      dueDate: form.dueDate || null,
      estimatedTime: estimatedToMinutes(form.estimatedTimeValue, form.estimatedTimeUnit),
      reminderDate: buildReminderDate(form.dueDate, form.reminderOption, form.customReminderDate),
      repeatType: form.isRecurring ? form.repeatType : 'none',
      repeatEvery: form.isRecurring ? Number(form.repeatEvery || 1) : null,
      repeatEnd: form.isRecurring ? form.repeatEnd || null : null,
      repeatDays: form.isRecurring ? form.repeatDays : [],
      repeatMaxOccurrences: form.isRecurring && form.repeatMaxOccurrences ? Number(form.repeatMaxOccurrences) : null,
      repeatStopped: form.isRecurring ? form.repeatStopped : false,
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

  const handleArchive = () => {
    if (task && confirm('Archiviare questo task?')) {
      archiveTask(task.id)
      onClose()
    }
  }

  const toggleRepeatDay = (day: number) => {
    setForm({
      ...form,
      repeatDays: form.repeatDays.includes(day)
        ? form.repeatDays.filter((value) => value !== day)
        : [...form.repeatDays, day],
    })
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
          <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
        Note
    </label>

    <textarea
        rows={5}
        value={form.notes}
        onChange={(e)=>
            setForm({
                ...form,
                notes:e.target.value
            })
        }
        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
        placeholder="Inserisci eventuali note..."
    />
</div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link
            </label>
            <input
              type="text"
              value={form.links}
              onChange={(e) => setForm({ ...form, links: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://esempio.com, https://altro.com (separati da virgola)"
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
                Categoria
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nessuna categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Progetto
            </label>
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Nessun progetto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Scadenza
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({ ...form, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Promemoria
              </label>
              <div className="relative">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.reminderOption}
                  onChange={(e) =>
                    setForm({ ...form, reminderOption: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Nessun promemoria</option>
                  {REMINDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {form.reminderOption === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data e ora promemoria
              </label>
              <input
                type="datetime-local"
                value={form.customReminderDate}
                onChange={(e) =>
                  setForm({ ...form, customReminderDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tempo stimato
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.estimatedTimeValue}
                onChange={(e) =>
                  setForm({ ...form, estimatedTimeValue: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Es. 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unità
              </label>
              <select
                value={form.estimatedTimeUnit}
                onChange={(e) =>
                  setForm({ ...form, estimatedTimeUnit: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="minutes">Minuti</option>
                <option value="hours">Ore</option>
                <option value="days">Giorni</option>
                <option value="weeks">Settimane</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) =>
                  setForm({ ...form, isRecurring: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Task ricorrente
            </label>

            {form.isRecurring && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Frequenza
                    </label>
                    <select
                      value={form.repeatType}
                      onChange={(e) =>
                        setForm({ ...form, repeatType: e.target.value as RepeatType })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {REPEAT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ripeti ogni
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.repeatEvery}
                      onChange={(e) => setForm({ ...form, repeatEvery: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {(form.repeatType === 'weekly' || form.repeatType === 'custom') && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Giorni della settimana
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {WEEK_DAYS.map((day) => (
                        <button
                          type="button"
                          key={day.value}
                          onClick={() => toggleRepeatDay(day.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            form.repeatDays.includes(day.value)
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fine ricorrenza
                    </label>
                    <input
                      type="date"
                      value={form.repeatEnd}
                      onChange={(e) => setForm({ ...form, repeatEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Numero massimo
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.repeatMaxOccurrences}
                      onChange={(e) =>
                        setForm({ ...form, repeatMaxOccurrences: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nessun limite"
                    />
                  </div>
                </div>

                {isEditing && (
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.repeatStopped}
                      onChange={(e) =>
                        setForm({ ...form, repeatStopped: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    Interrompi ricorrenza
                  </label>
                )}
              </div>
            )}
          </div>

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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Allegati
            </label>
            <AttachmentUploader
              attachments={form.attachments}
              onChange={(attachments) => setForm({ ...form, attachments })}
              onUpload={task ? (files) => uploadTaskAttachments(task.id, files) : undefined}
              onDelete={task ? (id) => deleteAttachment(task.id, id) : undefined}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleArchive}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  Archivia
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Elimina
                </button>
              </div>
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
