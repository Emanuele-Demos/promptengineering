interface ProjectProgressBarProps {
  progress: number
  completedTasks: number
  totalTasks: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ProjectProgressBar({
  progress,
  completedTasks,
  totalTasks,
  showLabel = true,
  size = 'md',
}: ProjectProgressBarProps) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            Task completati {completedTasks} / {totalTasks}
          </span>
          <span className="font-semibold text-indigo-600">{progress}%</span>
        </div>
      )}
      <div className={`${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} bg-indigo-600 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}
