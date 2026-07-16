import { Check, X, Clock } from 'lucide-react'
import type { TaskOccurrence } from '../types'
import { OCCURRENCE_STATUS_LABELS } from '../utils/recurrence'

interface OccurrenceListProps {
  occurrences: TaskOccurrence[]
}

const STATUS_ICON = {
  scheduled: Clock,
  completed: Check,
  cancelled: X,
}

const STATUS_COLOR = {
  scheduled: 'text-indigo-600 bg-indigo-50',
  completed: 'text-emerald-600 bg-emerald-50',
  cancelled: 'text-slate-500 bg-slate-100',
}

export function OccurrenceList({ occurrences }: OccurrenceListProps) {
  if (occurrences.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna occorrenza pianificata.</p>
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
      {occurrences.map((occ) => {
        const Icon = STATUS_ICON[occ.status]
        return (
          <li key={`${occ.date}-${occ.sequence}`} className="flex items-center gap-3 px-3 py-2.5 bg-white">
            <span className="text-xs font-mono text-slate-400 w-6">#{occ.sequence}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {new Date(occ.date).toLocaleDateString('it-IT')}
                {occ.time && <span className="text-slate-500 font-normal"> · {occ.time}</span>}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[occ.status]}`}
            >
              <Icon className="w-3 h-3" />
              {OCCURRENCE_STATUS_LABELS[occ.status]}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
