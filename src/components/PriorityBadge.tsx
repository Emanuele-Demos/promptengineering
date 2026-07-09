import { PRIORITY_LABELS, type TaskPriority } from '../types'
import { priorityStyles } from '../utils/helpers'

interface PriorityBadgeProps {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = priorityStyles[priority]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
