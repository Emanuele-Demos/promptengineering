import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TaskOccurrence } from '../types'

interface OccurrenceCalendarProps {
  occurrences: TaskOccurrence[]
  title?: string
}

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function getMonthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1))
  const startOffset = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: Array<{ date: string | null; day: number | null }> = []

  for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date, day: d })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null })
  return cells
}

const STATUS_STYLES: Record<TaskOccurrence['status'], string> = {
  scheduled: 'bg-indigo-500 text-white',
  completed: 'bg-emerald-500 text-white',
  cancelled: 'bg-slate-300 text-slate-600 line-through',
}

export function OccurrenceCalendar({ occurrences, title }: OccurrenceCalendarProps) {
  const initial = occurrences[0]?.date ? new Date(occurrences[0].date) : new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const [selected, setSelected] = useState<TaskOccurrence | null>(null)

  const byDate = useMemo(() => {
    const map = new Map<string, TaskOccurrence>()
    for (const occ of occurrences) map.set(occ.date, occ)
    return map
  }, [occurrences])

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setSelected(null)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="p-1 rounded hover:bg-slate-200 text-slate-600"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800 capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="p-1 rounded hover:bg-slate-200 text-slate-600"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
        {WEEKDAY_HEADERS.map((h) => (
          <div key={h} className="bg-slate-50 text-[10px] font-semibold text-slate-500 text-center py-1">
            {h}
          </div>
        ))}
        {grid.map((cell, i) => {
          const occ = cell.date ? byDate.get(cell.date) : undefined
          return (
            <button
              key={i}
              type="button"
              disabled={!cell.date}
              onClick={() => occ && setSelected(occ)}
              className={`min-h-[2.5rem] bg-white text-xs p-1 relative ${
                cell.date ? 'hover:bg-indigo-50' : 'bg-slate-50'
              } ${selected?.date === cell.date ? 'ring-2 ring-indigo-400 ring-inset' : ''}`}
            >
              {cell.day && <span className="text-slate-600">{cell.day}</span>}
              {occ && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${STATUS_STYLES[occ.status].split(' ')[0]}`}
                />
              )}
            </button>
          )
        })}
      </div>

      {(selected || title) && (
        <div className="px-3 py-2 border-t border-slate-100 text-xs text-slate-600">
          {selected ? (
            <>
              <span className="font-medium text-slate-800">
                {new Date(selected.date).toLocaleDateString('it-IT')}
              </span>
              {selected.time && ` · ${selected.time}`}
              {' · '}
              #{selected.sequence} · {selected.status}
            </>
          ) : (
            title && <span>{title}</span>
          )}
        </div>
      )}
    </div>
  )
}
