import { useState, useRef, useEffect } from 'react'
import { Calendar, GripVertical, Bell, BellOff, X } from 'lucide-react'
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

// Opzioni di promemoria rapido
const REMINDER_OPTIONS = [
  { label: 'Nessun promemoria', value: null },
  { label: '5 minuti prima', offsetMin: 5 },
  { label: '30 minuti prima', offsetMin: 30 },
  { label: '1 ora prima', offsetMin: 60 },
  { label: '1 giorno prima', offsetMin: 60 * 24 },
]

export function TaskCard({
  task,
  onClick,
  draggable = false,
  onDragStart,
}: TaskCardProps) {
  const { getMember, updateTask } = useApp()
  const assignee = getMember(task.assigneeId)
  const overdue = isOverdue(task.dueDate, task.status)

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const bellBtnRef = useRef<HTMLButtonElement>(null)

  const hasActiveReminder = !!(task.reminderDate && !task.reminderSent)

  // Chiudi popover al click esterno
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        bellBtnRef.current &&
        !bellBtnRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [popoverOpen])

  async function handleReminderSelect(option: typeof REMINDER_OPTIONS[number]) {
    setSaving(true)
    try {
      if (option.value === null || !('offsetMin' in option)) {
        // Rimuovi promemoria
        await updateTask(task.id, { reminderDate: null, reminderSent: false })
      } else if (task.dueDate) {
        // Calcola reminderDate sottraendo l'offset dalla dueDate
        const due = new Date(task.dueDate)
        const reminderDate = new Date(due.getTime() - option.offsetMin! * 60 * 1000)
        await updateTask(task.id, {
          reminderDate: reminderDate.toISOString(),
          reminderSent: false,
        })
      }
    } finally {
      setSaving(false)
      setPopoverOpen(false)
    }
  }

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

              {/* Campanella rapida promemoria */}
              {task.status !== 'done' && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    ref={bellBtnRef}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!task.dueDate && !task.reminderDate) return
                      setPopoverOpen((v) => !v)
                    }}
                    title={
                      !task.dueDate && !task.reminderDate
                        ? 'Imposta prima una data di scadenza per aggiungere un promemoria'
                        : hasActiveReminder
                        ? 'Promemoria attivo — clicca per modificare'
                        : 'Aggiungi promemoria rapido'
                    }
                    className={`relative p-1 rounded-lg transition-all duration-150 ${
                      hasActiveReminder
                        ? 'text-amber-500 hover:bg-amber-50'
                        : !task.dueDate
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {hasActiveReminder ? (
                      <Bell className="w-3.5 h-3.5 fill-amber-400" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5" />
                    )}
                    {/* Dot indicatore animato */}
                    {hasActiveReminder && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                    )}
                  </button>

                  {/* Popover selezione promemoria */}
                  {popoverOpen && (
                    <div
                      ref={popoverRef}
                      className="absolute bottom-full right-0 mb-2 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
                      style={{ minWidth: '200px' }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                          <Bell className="w-3 h-3 text-indigo-500" />
                          Promemoria rapido
                        </span>
                        <button
                          onClick={() => setPopoverOpen(false)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Opzioni */}
                      <div className="py-1">
                        {REMINDER_OPTIONS.map((opt, i) => {
                          const isRemove = opt.value === null
                          const isSelected =
                            isRemove
                              ? !task.reminderDate
                              : (() => {
                                  if (!task.reminderDate || !task.dueDate || !('offsetMin' in opt))
                                    return false
                                  const due = new Date(task.dueDate)
                                  const rem = new Date(task.reminderDate)
                                  const diff = Math.round(
                                    (due.getTime() - rem.getTime()) / (60 * 1000)
                                  )
                                  return Math.abs(diff - (opt.offsetMin ?? 0)) < 2
                                })()

                          const disabled = !isRemove && !task.dueDate

                          return (
                            <button
                              key={i}
                              disabled={disabled || saving}
                              onClick={() => !disabled && handleReminderSelect(opt)}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                                disabled
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : isRemove && isSelected
                                  ? 'text-slate-400 hover:bg-slate-50'
                                  : isSelected
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                  : isRemove
                                  ? 'text-red-500 hover:bg-red-50'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isRemove ? (
                                <BellOff className="w-3 h-3 shrink-0" />
                              ) : (
                                <Bell
                                  className={`w-3 h-3 shrink-0 ${isSelected ? 'fill-indigo-500 text-indigo-500' : ''}`}
                                />
                              )}
                              {opt.label}
                              {isSelected && !isRemove && (
                                <span className="ml-auto text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">
                                  ATTIVO
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Info data scadenza */}
                      {task.dueDate && (
                        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Scade: {new Date(task.dueDate).toLocaleString('it-IT', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
