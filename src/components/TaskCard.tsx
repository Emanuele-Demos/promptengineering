import { Calendar, GripVertical, Paperclip, Repeat, Star } from 'lucide-react'
import type { Task, Category } from '../types'
import { useApp } from '../store/AppContext'
import { formatDate, isOverdue } from '../utils/helpers'
import { formatNextOccurrence, formatRecurrenceSummary } from '../utils/recurrence'
import { MemberAvatar } from './MemberAvatar'
import { PriorityBadge } from './PriorityBadge'
import { CategoryBadge } from './CategoryBadge'

interface TaskCardProps {
  task: Task
  onClick: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  category?: Category
}

export function TaskCard({
  task,
  onClick,
  draggable = false,
  onDragStart,
  category,
}: TaskCardProps) {
  const { getMember, toggleFavorite } = useApp()
  const assignee = getMember(task.assigneeId)
  const isFavorite = Boolean(task.favorite)
  const overdue = isOverdue(task.dueDate, task.status)
  const recurrenceSummary = task.isRecurring ? formatRecurrenceSummary(task) : ''
  const nextOccurrenceLabel = task.isRecurring ? formatNextOccurrence(task.nextOccurrence) : null

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="group bg-white rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(task.id)
              }}
              className={`shrink-0 p-0.5 rounded transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
              }`}
              aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <Star
                className={`w-4 h-4 transition-transform duration-200 ${isFavorite ? 'fill-current scale-105' : ''}`}
              />
            </button>
            {task.isRecurring && (
              <Repeat className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden />
            )}
            <h4 className="text-sm font-semibold text-slate-900 leading-snug">
              {task.title}
            </h4>
            {task.isRecurring && (
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold uppercase tracking-wide">
                Ricorrente
              </span>
            )}
            {category && <CategoryBadge category={category} />}
          </div>

          {recurrenceSummary && (
            <p className="text-[11px] text-indigo-600 mb-2">{recurrenceSummary}</p>
          )}

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} />
              {task.attachments && task.attachments.length > 0 && (
                <span
                  className="flex items-center gap-0.5 text-xs text-slate-400"
                  title={`${task.attachments.length} allegati`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  {task.attachments.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {nextOccurrenceLabel && (
                <span className="text-[10px] text-indigo-500" title="Prossima ricorrenza">
                  ↪ {nextOccurrenceLabel}
                </span>
              )}
              {task.dueDate && (
                <span
                  className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-600 font-medium' : 'text-slate-500'
                    }`}
                >
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
              {assignee && (
                <MemberAvatar
                  name={assignee.name}
                  color={assignee.color}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
