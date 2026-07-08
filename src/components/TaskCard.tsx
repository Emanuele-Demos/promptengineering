import { Calendar, GripVertical } from 'lucide-react'
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
  const { getMember } = useApp()
  const assignee = getMember(task.assigneeId)
  const overdue = isOverdue(task.dueDate, task.status)

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
          <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-2">
            {task.title}
          </h4>

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
            <PriorityBadge priority={task.priority} />

            <div className="flex items-center gap-2 shrink-0">
              {task.dueDate && (
                <span
                  className={`flex items-center gap-1 text-[11px] ${
                    overdue ? 'text-red-600 font-medium' : 'text-slate-500'
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
