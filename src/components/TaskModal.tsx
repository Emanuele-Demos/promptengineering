import { useEffect, useState, type FormEvent } from 'react'
import { Archive, NotebookPen, Paperclip, Repeat2, Star, Trash2, X } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { Attachment, ReminderOption, Task, TaskPriority, TaskStatus } from '../types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../types'
import { useApp } from '../store/AppContext'

interface TaskModalProps {
  task?: Task | null
  defaultStatus?: TaskStatus
  open: boolean
  onClose: () => void
}

type ReminderChoice = '' | ReminderOption

const emptyForm = {
  title: '',
  description: '',
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  assigneeId: '' as string,
  dueDate: '',
  tags: '',
  favorite: false,
  categoryId: '' as string,
  reminder: '' as ReminderChoice,
  customReminder: '' as string,
  estimatedMinutes: '' as string,
  projectId: '' as string,
  repeatType: '' as string,
  repeatEvery: '1' as string,
  repeatEnd: '' as string,
  notes: '',
  attachments: [] as Attachment[],
  archived: false as boolean,
}

export function TaskModal({
  task,
  defaultStatus = 'todo',
  open,
  onClose,
}: TaskModalProps) {
  const { members, categories, projects, addTask, updateTask, deleteTask, archiveTask } = useApp()
  const isEditing = !!task

  const [form, setForm] = useState(emptyForm)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId ?? '',
        dueDate: task.dueDate ?? '',
        tags: task.tags.join(', '),
        favorite: !!task.favorite,
        categoryId: task.categoryId ?? '',
        reminder: task.reminder ?? '',
        customReminder: task.customReminder ?? '',
        estimatedMinutes: task.estimatedMinutes?.toString() ?? '',
        projectId: task.projectId ?? '',
        repeatType: task.repeatType ?? '',
        repeatEvery: task.repeatEvery?.toString() ?? '1',
        repeatEnd: task.repeatEnd ?? '',
        notes: task.notes ?? '',
        attachments: task.attachments ?? [],
        archived: !!task.archived,
      })
      setIsRecurring(!!task.repeatType)
    } else {
      const next = { ...emptyForm, status: defaultStatus }
      setForm(next)
      setIsRecurring(false)
    }
  }, [task, defaultStatus, open])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      favorite: form.favorite,
      categoryId: form.categoryId || null,
      reminder: (form.reminder || null) as ReminderOption | null,
      customReminder: form.customReminder || null,
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
      projectId: form.projectId || null,
      repeatType: isRecurring ? form.repeatType || 'weekly' : null,
      repeatEvery: isRecurring ? Number(form.repeatEvery || 1) : null,
      repeatEnd: isRecurring ? form.repeatEnd || null : null,
      notes: form.notes.trim() || undefined,
      attachments: form.attachments,
      archived: form.archived,
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
    if (task) {
      archiveTask(task.id)
      onClose()
    }
  }

  const handleAddAttachment = () => {
    const trimmed = attachmentUrl.trim()
    if (!trimmed) return
    const name = trimmed.split('/').pop() || 'Allegato'
    setForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments ?? []), { id: uuid(), name, url: trimmed }],
    }))
    setAttachmentUrl('')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setForm((prev) => ({
        ...prev,
        attachments: [...(prev.attachments ?? []), { id: uuid(), name: file.name, url: dataUrl }],
      }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Modifica task' : 'Nuovo task'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titolo *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Es. Implementare login utenti"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, favorite: !form.favorite })}
                className={`px-3 py-2 border rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                  form.favorite
                    ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
                title={form.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              >
                <Star className={`w-5 h-5 ${form.favorite ? 'fill-amber-400 text-amber-500' : ''}`} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Dettagli del task..."
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assegnato a</label>
              <select
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Non assegnato</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scadenza</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nessuna categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Progetto</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nessun progetto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Promemoria</label>
              <select
                value={form.reminder}
                onChange={(e) => setForm({ ...form, reminder: e.target.value as ReminderChoice })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Nessun promemoria</option>
                <option value="5m">5 minuti prima</option>
                <option value="30m">30 minuti prima</option>
                <option value="1h">1 ora prima</option>
                <option value="1d">1 giorno prima</option>
                <option value="custom">Personalizzato</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tempo stimato (minuti)</label>
              <input
                type="number"
                min="0"
                value={form.estimatedMinutes}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="120"
              />
            </div>
          </div>

          {form.reminder === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Promemoria personalizzato</label>
              <input
                type="text"
                value={form.customReminder}
                onChange={(e) => setForm({ ...form, customReminder: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Es. 2 ore prima"
              />
            </div>
          )}

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

          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Repeat2 className="w-4 h-4 text-indigo-500" />
              Task ricorrente
            </label>
            {isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frequenza</label>
                  <select
                    value={form.repeatType}
                    onChange={(e) => setForm({ ...form, repeatType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">Ogni giorno</option>
                    <option value="weekly">Ogni settimana</option>
                    <option value="monthly">Ogni mese</option>
                    <option value="yearly">Ogni anno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ogni</label>
                  <input
                    type="number"
                    min="1"
                    value={form.repeatEvery}
                    onChange={(e) => setForm({ ...form, repeatEvery: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fine ricorrenza</label>
                  <input
                    type="date"
                    value={form.repeatEnd}
                    onChange={(e) => setForm({ ...form, repeatEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <NotebookPen className="w-4 h-4 text-indigo-500" />
              Note e allegati
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Aggiungi note o dettagli aggiuntivi"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="Link allegato" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <button type="button" onClick={handleAddAttachment} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700"> <Paperclip className="w-4 h-4" /> Aggiungi link </button>
            </div>
            <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-600 cursor-pointer">
              <Paperclip className="w-4 h-4" />
              Carica file
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
            {form.attachments?.length ? (
              <div className="space-y-2">
                {form.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline truncate">
                      <Paperclip className="w-4 h-4 shrink-0" />
                      <span className="truncate">{attachment.name}</span>
                    </a>
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, attachments: prev.attachments?.filter((item) => item.id !== attachment.id) ?? [] }))} className="text-slate-400 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {isEditing ? (
                <button type="button" onClick={handleArchive} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors w-full sm:w-auto">
                  <Archive className="w-4 h-4" /> Archivia
                </button>
              ) : null}
              {isEditing ? (
                <button type="button" onClick={handleDelete} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto">
                  <Trash2 className="w-4 h-4" /> Elimina
                </button>
              ) : null}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annulla</button>
              <button type="submit" className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">{isEditing ? 'Salva' : 'Crea task'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
