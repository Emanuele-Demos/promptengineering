import { BellRing, Calendar, Clock3, GripVertical, Star } from 'lucide-react'
import type { Task } from '../types'
import { useApp } from '../store/AppContext'
import { formatDate, isOverdue } from '../utils/helpers'
import { MemberAvatar } from './MemberAvatar'
import { PriorityBadge } from './PriorityBadge'

interface TaskCardProps {
  task: Task
  onClick: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}

export function TaskCard({
  task,
  onClick,
  draggable = false,
  onDragStart,
}: TaskCardProps) {
  const { getMember, getCategory, getProject, updateTask } = useApp()
  const assignee = getMember(task.assigneeId)
  const category = getCategory(task.categoryId ?? null)
  const project = getProject(task.projectId ?? null)
  const overdue = isOverdue(task.dueDate, task.status)
  const estimatedLabel = task.estimatedMinutes
    ? `${Math.round(task.estimatedMinutes / 60)}h`
    : null

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
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-slate-900 leading-snug">{task.title}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation()
                updateTask(task.id, { favorite: !task.favorite })
              }}
              className="text-slate-400 hover:text-amber-500 focus:outline-none transition-colors shrink-0 p-0.5 -mr-1 -mt-0.5"
              title={task.favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <Star className={`w-4 h-4 transition-all duration-200 ${task.favorite ? 'fill-amber-400 text-amber-500 scale-110' : 'text-slate-300 hover:text-slate-400 opacity-60 hover:opacity-100'}`} />
            </button>
          </div>

          {(category || project || task.tags.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {category && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                  {category.name}
                </span>
              )}
              {project && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{project.name}</span>}
              {task.tags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{tag}</span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <PriorityBadge priority={task.priority} />

            <div className="flex items-center gap-2 shrink-0">
              {task.reminder && <BellRing className="w-3 h-3 text-amber-500" />}
              {estimatedLabel && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock3 className="w-3 h-3" />
                  {estimatedLabel}
                </span>
              )}
              {task.dueDate && (
                <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
              {assignee && <MemberAvatar name={assignee.name} color={assignee.color} size="sm" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
