import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus, ReminderType, RepeatType, RepeatCustomUnit, RepeatEndType, RepeatDay } from '../types'
import { PRIORITY_LABELS, REMINDER_LABELS, REPEAT_CUSTOM_UNIT_LABELS, REPEAT_END_TYPE_LABELS, REPEAT_TYPE_LABELS, REPEAT_DAYS, STATUS_LABELS } from '../types'
import { useApp } from '../store/AppContext'
import { upsertTask, uploadTaskAttachments } from '../api/tasks.js'
import { setCurrentUserId } from '../api/notifications.js'
import { useCategories } from '../hooks/useCategories'
import { useProjects } from '../hooks/useProjects'
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  validateReminderClient,
} from '../utils/reminder'
import {
  validateRecurrenceClient,
} from '../utils/recurrence'
import {
  minutesToFormFields,
  parseEstimatedTimeForm,
  validateEstimatedTimeForm,
} from '../utils/estimatedTime'
import type { EstimatedTimeUnit } from '../utils/estimatedTime'
import { EstimatedTimeField } from './EstimatedTimeField'
import { TaskNotesSection } from './TaskNotesSection'
import { AttachmentUploader, type PendingAttachment } from './AttachmentUploader'
import { TaskAttachmentsSection } from './TaskAttachmentsSection'
import { TaskRecurrencePanel } from './TaskRecurrencePanel'

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
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  assigneeId: null as number | null,
  dueDate: '',
  tags: '',
  categoryId: '',
  projectId: '',
  reminderType: 'none' as ReminderType,
  customReminderAt: '',
  isRecurring: false,
  isRecurringActive: true,
  repeatType: 'monthly' as RepeatType,
  repeatEvery: 1,
  repeatCustomUnit: 'days' as RepeatCustomUnit,
  repeatDays: ['monday'] as RepeatDay[],
  repeatEndType: 'never' as RepeatEndType,
  repeatEnd: '',
  repeatOccurrences: 10,
  maxOccurrences: null as number | null,
  estimatedTimeValue: '',
  estimatedTimeUnit: 'hours' as EstimatedTimeUnit,
}

function defaultRepeatDaysFromDueDate(dueDate: string): RepeatDay[] {
  if (!dueDate) return ['monday']
  const dow = new Date(`${dueDate}T12:00:00.000Z`).getUTCDay()
  return [REPEAT_DAYS[(dow + 6) % 7] ?? 'monday']
}

export function TaskModal({
  task,
  defaultStatus = 'todo',
  open,
  onClose,
}: TaskModalProps) {
  const { members, addTask, updateTask, deleteTask } = useApp()
  const { categories, loading: categoriesLoading } = useCategories()
  const { projects, loading: projectsLoading } = useProjects()
  const isEditing = !!task

  const [form, setForm] = useState(emptyForm)
  const [syncError, setSyncError] = useState('')
  const [reminderError, setReminderError] = useState('')
  const [recurrenceError, setRecurrenceError] = useState('')
  const [estimatedTimeError, setEstimatedTimeError] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [reminderSaved, setReminderSaved] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        notes: task.notes,
        links: task.links.join(', '),
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId ?? null,
        dueDate: task.dueDate ?? '',
        tags: task.tags.join(', '),
        categoryId: task.categoryId ?? '',
        projectId: task.projectId ?? '',
        reminderType: (task.reminderType ?? 'none') as ReminderType,
        customReminderAt:
          task.reminderType === 'custom' ? toDatetimeLocalValue(task.reminderDate) : '',
        isRecurring: task.isRecurring ?? false,
        isRecurringActive: task.isRecurringActive !== false,
        repeatType: (task.repeatType ?? 'monthly') as RepeatType,
        repeatEvery: task.repeatEvery ?? 1,
        repeatCustomUnit: (task.repeatCustomUnit ?? 'days') as RepeatCustomUnit,
        repeatDays: task.repeatDays?.length
          ? task.repeatDays
          : defaultRepeatDaysFromDueDate(task.dueDate ?? ''),
        repeatEndType: (task.repeatEndType ?? 'never') as RepeatEndType,
        repeatEnd: task.repeatEnd ?? '',
        repeatOccurrences: task.repeatOccurrences ?? 10,
        maxOccurrences: task.maxOccurrences ?? null,
        estimatedTimeValue: minutesToFormFields(task.estimatedTime).value,
        estimatedTimeUnit: minutesToFormFields(task.estimatedTime).unit,
      })
    } else {
      setForm({ ...emptyForm, status: defaultStatus })
    }
    setSyncError('')
    setReminderError('')
    setRecurrenceError('')
    setEstimatedTimeError('')
    setPendingAttachments((prev) => {
      prev.forEach((item) => {
        if (item.attachment.path.startsWith('blob:')) {
          URL.revokeObjectURL(item.attachment.path)
        }
      })
      return []
    })
    setReminderSaved('')
  }, [task, defaultStatus, open])

  if (!open) return null

  const buildPayload = (taskId: string, createdAt: string) => {
    const reminderType = form.reminderType
    const reminderDate =
      reminderType === 'custom'
        ? fromDatetimeLocalValue(form.customReminderAt)
        : null

    return {
      id: taskId,
      title: form.title.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      links: form.links.split(',').map((l) => l.trim()).filter(Boolean),
      attachments: [],
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId,
      categoryId: form.categoryId || null,
      projectId: form.projectId || null,
      dueDate: form.dueDate || null,
      reminderType: reminderType === 'none' ? null : reminderType,
      reminderDate,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isRecurring: form.isRecurring,
      isRecurringActive: form.isRecurring ? form.isRecurringActive : false,
      repeatType: form.isRecurring ? form.repeatType : null,
      repeatEvery: form.repeatEvery,
      repeatCustomUnit: form.isRecurring && form.repeatType === 'custom' ? form.repeatCustomUnit : null,
      repeatDays: form.isRecurring && form.repeatType === 'weekly' ? form.repeatDays : [],
      repeatEndType: form.isRecurring ? form.repeatEndType : 'never',
      repeatEnd: form.isRecurring && form.repeatEndType === 'date' ? form.repeatEnd || null : null,
      repeatOccurrences:
        form.isRecurring && form.repeatEndType === 'occurrences' ? form.repeatOccurrences : null,
      maxOccurrences: form.isRecurring ? form.maxOccurrences : null,
      occurrencesGenerated: task?.currentOccurrences ?? task?.occurrencesGenerated ?? (form.isRecurring ? 1 : 0),
      currentOccurrences: task?.currentOccurrences ?? task?.occurrencesGenerated ?? (form.isRecurring ? 1 : 0),
      lastGeneratedAt: task?.lastGeneratedAt ?? null,
      nextOccurrence: task?.nextOccurrence ?? null,
      parentTaskId: task?.parentTaskId ?? null,
      estimatedTime: parseEstimatedTimeForm(form.estimatedTimeValue, form.estimatedTimeUnit),
      actualTime: task?.actualTime ?? null,
      createdAt,
      updatedAt: new Date().toISOString(),
    }
  }

  const syncToBackend = async (payload: ReturnType<typeof buildPayload>) => {
    try {
      await upsertTask(payload)
      setSyncError('')
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Errore sincronizzazione backend')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const validationMsg =   validateReminderClient(
      form.dueDate || null,
      form.reminderType,
      form.customReminderAt || null
    )
    if (validationMsg) {
      setReminderError(validationMsg)
      return
    }

    const recurrenceMsg = validateRecurrenceClient(
      form.isRecurring,
      form.dueDate || null,
      form.repeatEvery,
      form.repeatEndType,
      form.repeatEnd || null,
      form.repeatOccurrences,
      form.repeatType,
      form.repeatCustomUnit,
      form.repeatDays,
      form.maxOccurrences
    )
    if (recurrenceMsg) {
      setRecurrenceError(recurrenceMsg)
      return
    }

    const timeMsg = validateEstimatedTimeForm(form.estimatedTimeValue, form.estimatedTimeUnit)
    if (timeMsg) {
      setEstimatedTimeError(timeMsg)
      return
    }
    setEstimatedTimeError('')

    if (form.assigneeId) {
      setCurrentUserId(form.assigneeId)
    }

    if (isEditing && task) {
      const payload = buildPayload(task.id, task.createdAt)
      updateTask(task.id, {
        title: payload.title,
        description: payload.description,
        notes: payload.notes,
        links: payload.links,
        attachments: task.attachments,
        status: payload.status,
        priority: payload.priority,
        assigneeId: payload.assigneeId,
        categoryId: payload.categoryId,
        projectId: payload.projectId,
        dueDate: payload.dueDate,
        reminderType: payload.reminderType,
        reminderDate: payload.reminderDate,
        tags: payload.tags,
        isRecurring: payload.isRecurring,
        isRecurringActive: payload.isRecurringActive,
        repeatType: payload.repeatType,
        repeatEvery: payload.repeatEvery,
        repeatCustomUnit: payload.repeatCustomUnit,
        repeatDays: payload.repeatDays,
        repeatEndType: payload.repeatEndType,
        repeatEnd: payload.repeatEnd,
        repeatOccurrences: payload.repeatOccurrences,
        maxOccurrences: payload.maxOccurrences,
        occurrencesGenerated: payload.occurrencesGenerated,
        currentOccurrences: payload.currentOccurrences,
        nextOccurrence: payload.nextOccurrence,
        estimatedTime: payload.estimatedTime,
        actualTime: payload.actualTime,
      })
      await syncToBackend(payload)
      setReminderSaved(
        form.isRecurring
          ? 'Task ricorrente salvato con successo'
          : 'Promemoria salvato con successo'
      )
    } else {
      const now = new Date().toISOString()
      const localPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        links: form.links.split(',').map((l) => l.trim()).filter(Boolean),
        attachments: [] as Task['attachments'],
        status: form.status,
        priority: form.priority,
        assigneeId: form.assigneeId,
        categoryId: form.categoryId || null,
        projectId: form.projectId || null,
        dueDate: form.dueDate || null,
        reminderType: form.reminderType === 'none' ? null : form.reminderType,
        reminderDate:
          form.reminderType === 'custom'
            ? fromDatetimeLocalValue(form.customReminderAt)
            : null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isRecurring: form.isRecurring,
        isRecurringActive: form.isRecurringActive,
        repeatType: form.isRecurring ? form.repeatType : null,
        repeatEvery: form.repeatEvery,
        repeatCustomUnit: form.isRecurring && form.repeatType === 'custom' ? form.repeatCustomUnit : null,
        repeatDays: form.isRecurring && form.repeatType === 'weekly' ? form.repeatDays : [],
        repeatEndType: form.isRecurring ? form.repeatEndType : 'never',
        repeatEnd: form.isRecurring && form.repeatEndType === 'date' ? form.repeatEnd || null : null,
        repeatOccurrences:
          form.isRecurring && form.repeatEndType === 'occurrences' ? form.repeatOccurrences : null,
        maxOccurrences: form.isRecurring ? form.maxOccurrences : null,
        occurrencesGenerated: form.isRecurring ? 1 : 0,
        currentOccurrences: form.isRecurring ? 1 : 0,
        estimatedTime: parseEstimatedTimeForm(form.estimatedTimeValue, form.estimatedTimeUnit),
        actualTime: null,
      }
      const newId = addTask({
        ...localPayload,
        attachments: pendingAttachments.map((item) => item.attachment),
      })
      await syncToBackend(buildPayload(newId, now))

      if (pendingAttachments.length > 0) {
        try {
          const uploaded = (await uploadTaskAttachments(
            newId,
            pendingAttachments.map((item) => item.file),
          )) as Task['attachments']
          updateTask(newId, { attachments: uploaded })
        } catch (err) {
          setSyncError(
            err instanceof Error
              ? err.message
              : 'Task creato, ma errore nel caricamento degli allegati',
          )
          setReminderSaved('Task creato con successo')
          return
        }
      }

      setReminderSaved(
        form.isRecurring
          ? 'Task ricorrente creato con successo'
          : 'Promemoria salvato con successo'
      )
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
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
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
          {syncError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {syncError}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titolo *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Es. Implementare login utenti"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Dettagli del task..."
            />
          </div>

          {isEditing && task ? (
            <>
              <TaskNotesSection taskId={task.id} />
              <TaskAttachmentsSection taskId={task.id} />
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                Le note saranno disponibili dopo il salvataggio del task.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Allegati</label>
                <AttachmentUploader
                  items={pendingAttachments}
                  onChange={setPendingAttachments}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link</label>
            <input
              type="text"
              value={form.links}
              onChange={(e) => setForm({ ...form, links: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://esempio.com (separati da virgola)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stato</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priorità</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {reminderError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {reminderError}
            </p>
          )}

          {recurrenceError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {recurrenceError}
            </p>
          )}

          {reminderSaved && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {reminderSaved}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scadenza</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <EstimatedTimeField
            value={form.estimatedTimeValue}
            unit={form.estimatedTimeUnit}
            error={estimatedTimeError || undefined}
            onChange={(patch) =>
              setForm({
                ...form,
                estimatedTimeValue: patch.value ?? form.estimatedTimeValue,
                estimatedTimeUnit: patch.unit ?? form.estimatedTimeUnit,
              })
            }
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Promemoria</label>
            <select
              value={form.reminderType}
              onChange={(e) =>
                setForm({
                  ...form,
                  reminderType: e.target.value as ReminderType,
                  customReminderAt: e.target.value === 'custom' ? form.customReminderAt : '',
                })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(Object.entries(REMINDER_LABELS) as [ReminderType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            {form.reminderType === 'custom' && (
              <input
                type="datetime-local"
                value={form.customReminderAt}
                onChange={(e) => setForm({ ...form, customReminderAt: e.target.value })}
                className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            {form.reminderType !== 'none' && !form.dueDate && (
              <p className="text-xs text-amber-700 mt-1">Imposta una scadenza per attivare il promemoria.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">Task ricorrente</span>
            </label>

            {form.isRecurring && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frequenza</label>
                    <select
                      value={form.repeatType}
                      onChange={(e) => {
                        const repeatType = e.target.value as RepeatType
                        setForm({
                          ...form,
                          repeatType,
                          repeatDays:
                            repeatType === 'weekly' && form.repeatDays.length === 0
                              ? defaultRepeatDaysFromDueDate(form.dueDate)
                              : form.repeatDays,
                        })
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {(Object.entries(REPEAT_TYPE_LABELS) as [RepeatType, string][]).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ogni</label>
                    <input
                      type="number"
                      min={1}
                      value={form.repeatEvery}
                      onChange={(e) =>
                        setForm({ ...form, repeatEvery: Math.max(1, parseInt(e.target.value, 10) || 1) })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {form.repeatType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unità</label>
                    <select
                      value={form.repeatCustomUnit}
                      onChange={(e) =>
                        setForm({ ...form, repeatCustomUnit: e.target.value as RepeatCustomUnit })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {(Object.entries(REPEAT_CUSTOM_UNIT_LABELS) as [RepeatCustomUnit, string][]).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fine ricorrenza</label>
                  <select
                    value={form.repeatEndType}
                    onChange={(e) =>
                      setForm({ ...form, repeatEndType: e.target.value as RepeatEndType })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(Object.entries(REPEAT_END_TYPE_LABELS) as [RepeatEndType, string][]).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {form.repeatEndType === 'date' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data di fine</label>
                    <input
                      type="date"
                      value={form.repeatEnd}
                      onChange={(e) => setForm({ ...form, repeatEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {form.repeatEndType === 'occurrences' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Numero massimo di occorrenze
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.repeatOccurrences}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          repeatOccurrences: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {!form.dueDate && (
                  <p className="text-xs text-amber-700">Imposta una scadenza per calcolare la prossima ricorrenza.</p>
                )}

                <TaskRecurrencePanel
                  taskId={isEditing ? task?.id : undefined}
                  form={{
                    isRecurring: form.isRecurring,
                    isRecurringActive: form.isRecurringActive,
                    repeatType: form.repeatType,
                    repeatEvery: form.repeatEvery,
                    repeatDays: form.repeatDays,
                    maxOccurrences: form.maxOccurrences,
                    repeatEndType: form.repeatEndType,
                    repeatEnd: form.repeatEnd,
                    dueDate: form.dueDate,
                    status: form.status,
                  }}
                  onFormChange={(patch) => setForm({ ...form, ...patch })}
                  onTaskUpdated={(updated) => {
                    updateTask(updated.id, {
                      isRecurringActive: updated.isRecurringActive,
                      isRecurring: updated.isRecurring,
                      nextOccurrence: updated.nextOccurrence,
                    })
                  }}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assegnato a</label>
              <select
                value={form.assigneeId ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assigneeId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Non assegnato</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <div className="flex items-center gap-2">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                disabled={categoriesLoading}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nessuna categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {form.categoryId && (
                <span
                  className="w-8 h-8 rounded-lg border border-slate-200 shrink-0"
                  style={{
                    backgroundColor:
                      categories.find((c) => c.id === form.categoryId)?.color ?? '#94A3B8',
                  }}
                  title="Anteprima colore categoria"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Progetto</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              disabled={projectsLoading}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Nessun progetto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.description ? ` — ${project.description.slice(0, 40)}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tag</label>
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
