import { PartyPopper, Target } from 'lucide-react'
import type { GoalWithProgress } from '../types'

const TYPE_LABELS = {
  daily: 'Obiettivo di oggi',
  weekly: 'Obiettivo della settimana',
}

interface GoalProgressCardProps {
  goal: GoalWithProgress
  compact?: boolean
}

export function GoalProgressCard({ goal, compact = false }: GoalProgressCardProps) {
  const reached = goal.status === 'reached'

  return (
    <article
      className={`rounded-xl border p-4 transition-all ${
        reached
          ? 'border-emerald-200 bg-emerald-50/80 shadow-sm'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              reached ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            {reached ? <PartyPopper className="w-4 h-4" /> : <Target className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{TYPE_LABELS[goal.type]}</h3>
            {!compact && (
              <p className="text-xs text-slate-500">
                {goal.completedTasks} / {goal.target} task completati
              </p>
            )}
          </div>
        </div>
        <span
          className={`text-lg font-bold tabular-nums shrink-0 ${
            reached ? 'text-emerald-600' : 'text-indigo-600'
          }`}
        >
          {goal.completionPercentage}%
        </span>
      </div>

      <div className="mb-2">
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              reached ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${goal.completionPercentage}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-slate-600">
        {goal.completedTasks} / {goal.target} task
      </p>

      {reached && (
        <p className="mt-2 text-sm font-medium text-emerald-700">
          Complimenti! Hai raggiunto il tuo obiettivo {goal.type === 'daily' ? 'giornaliero' : 'settimanale'}.
        </p>
      )}
    </article>
  )
}
