import type { EstimatedTimeUnit } from '../utils/estimatedTime'
import {
  ESTIMATED_TIME_PRESETS,
  ESTIMATED_TIME_UNIT_LABELS,
  validateEstimatedTimeForm,
} from '../utils/estimatedTime'

interface EstimatedTimeFieldProps {
  value: string
  unit: EstimatedTimeUnit
  error?: string
  onChange: (patch: { value?: string; unit?: EstimatedTimeUnit }) => void
}

export function EstimatedTimeField({
  value,
  unit,
  error,
  onChange,
}: EstimatedTimeFieldProps) {
  const validationError = error ?? validateEstimatedTimeForm(value, unit)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">Tempo stimato</label>
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          min={0.5}
          step="any"
          value={value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Es. 2"
          className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Valore tempo stimato"
        />
        <select
          value={unit}
          onChange={(e) => onChange({ unit: e.target.value as EstimatedTimeUnit })}
          className="flex-1 min-w-[8rem] px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Unità tempo stimato"
        >
          {(Object.entries(ESTIMATED_TIME_UNIT_LABELS) as [EstimatedTimeUnit, string][]).map(
            ([u, label]) => (
              <option key={u} value={u}>
                {label}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ESTIMATED_TIME_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange({ value: String(preset.value), unit: preset.unit })}
            className="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {validationError && (
        <p className="text-xs text-red-600">{validationError}</p>
      )}
      {!validationError && !value.trim() && (
        <p className="text-xs text-slate-400">Opzionale — lascia vuoto se non vuoi stimare il tempo</p>
      )}
    </div>
  )
}
