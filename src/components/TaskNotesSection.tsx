import { useCallback, useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import type { TaskNote } from '../types'
import {
  createTaskNote,
  deleteTaskNote,
  getTaskNotes,
  updateTaskNote,
} from '../api/tasks.js'

interface TaskNotesSectionProps {
  taskId: string
}

interface DraftNote extends TaskNote {
  isNew?: boolean
  dirty?: boolean
}

export function TaskNotesSection({ taskId }: TaskNotesSectionProps) {
  const [notes, setNotes] = useState<DraftNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await getTaskNotes(taskId)) as TaskNote[]
      setNotes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento note')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const handleAdd = () => {
    const tempId = `temp-${crypto.randomUUID()}`
    setNotes((prev) => [
      ...prev,
      {
        id: tempId,
        taskId,
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isNew: true,
        dirty: true,
      },
    ])
  }

  const handleChange = (id: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, content, dirty: true } : note))
    )
  }

  const handleSave = async (note: DraftNote) => {
    if (!note.content.trim()) {
      setError('La nota non può essere vuota')
      return
    }

    setSavingId(note.id)
    setError('')
    try {
      if (note.isNew) {
        const saved = (await createTaskNote(taskId, note.content.trim())) as TaskNote
        setNotes((prev) => prev.map((n) => (n.id === note.id ? saved : n)))
      } else {
        const saved = (await updateTaskNote(note.id, note.content.trim())) as TaskNote
        setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...saved, dirty: false } : n)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore salvataggio nota')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (note: DraftNote) => {
    if (!confirm('Eliminare questa nota?')) return

    if (note.isNew) {
      setNotes((prev) => prev.filter((n) => n.id !== note.id))
      return
    }

    try {
      await deleteTaskNote(note.id)
      setNotes((prev) => prev.filter((n) => n.id !== note.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore eliminazione nota')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Note</label>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          <Plus className="w-3.5 h-3.5" />
          Aggiungi nota
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Caricamento note...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-500">Nessuna nota. Aggiungine una.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2"
            >
              <textarea
                rows={4}
                value={note.content}
                onChange={(e) => handleChange(note.id, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[96px]"
                placeholder="Scrivi una nota..."
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {note.isNew ? 'Nuova nota' : `Aggiornata: ${new Date(note.updatedAt).toLocaleString('it-IT')}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Elimina
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(note)}
                    disabled={savingId === note.id || !note.dirty}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingId === note.id ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
