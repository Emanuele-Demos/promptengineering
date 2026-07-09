import { Plus } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import { STATUS_LABELS } from '../types'
import { statusStyles } from '../utils/helpers'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
  onDrop: (status: TaskStatus) => void
  onDragOver: (e: React.DragEvent) => void
  draggingId: string | null
  onDragStart: (taskId: string) => void
}

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
  onDrop,
  onDragOver,
  draggingId,
  onDragStart,
}: KanbanColumnProps) {
  const style = statusStyles[status]

  return (
    <div
      className={`flex flex-col w-[min(85vw,18rem)] sm:w-72 shrink-0 snap-start rounded-xl border ${style.border} ${style.bg}`}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(status)
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${style.text}`}>
            {STATUS_LABELS[status]}
          </h3>
          <span className="px-1.5 py-0.5 bg-white/80 rounded text-xs font-medium text-slate-600">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white/60 transition-colors"
          title="Aggiungi task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100dvh-16rem)] sm:max-h-[calc(100vh-220px)] scrollbar-thin min-h-[120px]">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={draggingId === task.id ? 'opacity-40' : ''}
          >
            <TaskCard
              task={task}
              onClick={() => onTaskClick(task)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                onDragStart(task.id)
              }}
            />
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">
            Nessun task — trascina qui o clicca +
          </p>
        )}
      </div>
    </div>
  )
}
