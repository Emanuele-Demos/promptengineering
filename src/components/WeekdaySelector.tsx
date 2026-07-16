import type { RepeatDay } from '../types'
import { REPEAT_DAYS, REPEAT_DAY_LABELS } from '../types'

interface WeekdaySelectorProps {
  selected: RepeatDay[]
  onChange: (days: RepeatDay[]) => void
}

export function WeekdaySelector({ selected, onChange }: WeekdaySelectorProps) {
  const toggle = (day: RepeatDay) => {
    if (selected.includes(day)) {
      if (selected.length === 1) return
      onChange(selected.filter((d) => d !== day))
    } else {
      onChange([...selected, day])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {REPEAT_DAYS.map((day) => {
        const active = selected.includes(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              active
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
            title={REPEAT_DAY_LABELS[day]}
          >
            {REPEAT_DAY_LABELS[day]}
          </button>
        )
      })}
    </div>
  )
}
