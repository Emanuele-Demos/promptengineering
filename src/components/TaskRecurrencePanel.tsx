import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { RepeatDay, RepeatType, Task, TaskOccurrence } from '../types'
import { getTaskOccurrences, stopTaskRecurrence } from '../api/tasks.js'
import { generateOccurrencesPreview, formatRecurrenceSummary } from '../utils/recurrence'
import { WeekdaySelector } from './WeekdaySelector'
import { OccurrenceCalendar } from './OccurrenceCalendar'
import { OccurrenceList } from './OccurrenceList'

export interface RecurrenceFormSlice {
  isRecurring: boolean
  isRecurringActive: boolean
  repeatType: RepeatType
  repeatEvery: number
  repeatDays: RepeatDay[]
  maxOccurrences: number | null
  repeatEndType: Task['repeatEndType']
  repeatEnd: string
  dueDate: string
  status?: Task['status']
}

interface TaskRecurrencePanelProps {
  taskId?: string
  form: RecurrenceFormSlice
  onFormChange: (patch: Partial<RecurrenceFormSlice>) => void
  onTaskUpdated?: (task: Task) => void
}

export function TaskRecurrencePanel({
  taskId,
  form,
  onFormChange,
  onTaskUpdated,
}: TaskRecurrencePanelProps) {
  const [occurrences, setOccurrences] = useState<TaskOccurrence[]>([])
  const [loading, setLoading] = useState(false)
  const [stopLoading, setStopLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  const preview = useMemo(
    () =>
      generateOccurrencesPreview({
        isRecurring: form.isRecurring,
        isRecurringActive: form.isRecurringActive,
        repeatType: form.repeatType,
        repeatEvery: form.repeatEvery,
        repeatDays: form.repeatDays,
        repeatEndType: form.repeatEndType,
        repeatEnd: form.repeatEnd || null,
        maxOccurrences: form.maxOccurrences,
        dueDate: form.dueDate || null,
        status: form.status,
      }),
    [form]
  )

  const refreshFromApi = useCallback(async () => {
    if (!taskId || !form.isRecurring) {
      setOccurrences(preview)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = (await getTaskOccurrences(taskId)) as TaskOccurrence[]
      setOccurrences(data.length > 0 ? data : preview)
    } catch (err) {
      setOccurrences(preview)
      setError(err instanceof Error ? err.message : 'Errore caricamento occorrenze')
    } finally {
      setLoading(false)
    }
  }, [taskId, form.isRecurring, preview])

  useEffect(() => {
    if (taskId && form.isRecurring) {
      refreshFromApi()
    } else {
      setOccurrences(preview)
    }
  }, [taskId, preview, form.isRecurring, refreshFromApi])

  const handleStop = async (mode: 'from_today' | 'after_last' | 'delete_future') => {
    if (!taskId) return
    const labels = {
      from_today: 'interrompere la ricorrenza da oggi',
      after_last: 'interrompere dopo l\'ultima occorrenza generata',
      delete_future: 'eliminare le occorrenze future non completate',
    }
    if (!confirm(`Confermi di ${labels[mode]}? I task già completati non verranno modificati.`)) return

    setStopLoading(true)
    setError('')
    try {
      const updated = (await stopTaskRecurrence(taskId, mode)) as Task
      onFormChange({ isRecurringActive: updated.isRecurringActive ?? false })
      onTaskUpdated?.(updated)
      await refreshFromApi()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore interruzione ricorrenza')
    } finally {
      setStopLoading(false)
    }
  }

  if (!form.isRecurring) return null

  return (
    <div className="space-y-4 pt-2 border-t border-slate-200">
      <h3 className="text-sm font-semibold text-slate-800">Configurazione avanzata</h3>

      {form.repeatType === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Giorni della settimana</label>
          <WeekdaySelector
            selected={form.repeatDays}
            onChange={(repeatDays) => onFormChange({ repeatDays })}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Ripeti al massimo</label>
        <input
          type="number"
          min={1}
          value={form.maxOccurrences ?? ''}
          onChange={(e) =>
            onFormChange({
              maxOccurrences: e.target.value ? Math.max(1, parseInt(e.target.value, 10) || 1) : null,
            })
          }
          placeholder="Illimitato"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
            form.isRecurringActive !== false
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {form.isRecurringActive !== false ? 'Ricorrenza attiva' : 'Ricorrenza interrotta'}
        </span>
      </div>

      <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
        {formatRecurrenceSummary(form)}
      </p>

      {taskId && form.isRecurringActive !== false && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={stopLoading}
            onClick={() => handleStop('from_today')}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
          >
            Interrompi da oggi
          </button>
          <button
            type="button"
            disabled={stopLoading}
            onClick={() => handleStop('after_last')}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Dopo ultima generata
          </button>
          <button
            type="button"
            disabled={stopLoading}
            onClick={() => handleStop('delete_future')}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Elimina future
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-700">Occorrenze future</h4>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`px-2 py-1 rounded ${view === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}
            >
              Calendario
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-2 py-1 rounded ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}
            >
              Lista
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Caricamento occorrenze...
          </div>
        ) : view === 'calendar' ? (
          <OccurrenceCalendar occurrences={occurrences} title={form.dueDate ? undefined : 'Imposta una scadenza'} />
        ) : (
          <OccurrenceList occurrences={occurrences} />
        )}
      </div>
    </div>
  )
}
