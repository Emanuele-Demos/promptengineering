import { useState, useRef } from 'react'
import { Clock3, Plus, Search } from 'lucide-react'
import type { Task, TaskStatus } from '../types'
import { useApp } from '../store/AppContext'
import { KanbanColumn } from '../components/KanbanColumn'
import { TaskModal } from '../components/TaskModal'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

export function Board() {
  const { tasks, moveTask } = useApp()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [search, setSearch] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showEstimatedOnly, setShowEstimatedOnly] = useState(false)

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

    const matchesEstimated = !showEstimatedOnly || Boolean(t.estimatedTime?.trim())

    return matchesSearch && matchesEstimated
  })

  const openCreate = (status: TaskStatus) => {
    setSelectedTask(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleDrop = (status: TaskStatus) => {
    if (draggingId) {
      moveTask(draggingId, status)
      setDraggingId(null)
    }
  }



  // sensitivity multipliers
  const WHEEL_SCROLL_FACTOR = 0.8 // multiply wheel delta to tune sensitivity
  const PAN_SENSITIVITY = 1.15 // multiplier for pointer panning

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    // convert vertical wheel to horizontal scroll on desktop
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      containerRef.current.scrollLeft += e.deltaY * WHEEL_SCROLL_FACTOR
    }
  }

  // pointer-based panning (drag-to-scroll) without interfering with draggable tasks
  const isPanningRef = useRef(false)
  const panStartXRef = useRef(0)
  const panStartScrollRef = useRef(0)
  const isPotentialPanRef = useRef(false)
  const dragStartedRef = useRef(false)
  const dragListenerRef = useRef<((e: Event) => void) | null>(null)

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const target = e.target as HTMLElement
    // mark potential pan; we'll activate after threshold movement
    isPotentialPanRef.current = true
    dragStartedRef.current = false
    // listen for a real dragstart event; if it fires, cancel pan
    const onDragStart = () => {
      dragStartedRef.current = true
      isPotentialPanRef.current = false
      isPanningRef.current = false
      if (dragListenerRef.current) {
        document.removeEventListener('dragstart', dragListenerRef.current, true)
        dragListenerRef.current = null
      }
    }
    dragListenerRef.current = onDragStart
    document.addEventListener('dragstart', onDragStart, true)
    // only enable custom panning for mouse pointers (desktop)
    const pointerType = (e as any).pointerType
    if (pointerType && pointerType !== 'mouse') return
    // mark potential pan; we'll activate after threshold movement
    isPotentialPanRef.current = true
    panStartXRef.current = e.clientX
    panStartScrollRef.current = el.scrollLeft
    try {
      target.setPointerCapture?.(e.pointerId)
    } catch (err) {
      /* ignore */
    }
    // for mouse pointers temporarily disable native touch-action so custom panning works
    try {
      if (!pointerType || pointerType === 'mouse') {
        el.style.touchAction = 'none'
        el.style.cursor = 'grabbing'
      }
    } catch (err) {
      /* ignore */
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const dxTotal = e.clientX - panStartXRef.current
    // dynamic threshold: make smaller when showEstimatedOnly is active
    const PAN_THRESHOLD = showEstimatedOnly ? 4 : 8

    if (!isPanningRef.current && isPotentialPanRef.current) {
      if (Math.abs(dxTotal) >= PAN_THRESHOLD) {
        // if a real drag was detected, abort panning
        if (dragStartedRef.current) return
        isPanningRef.current = true
        // reset start points so movement feels smooth from this moment
        panStartXRef.current = e.clientX
        panStartScrollRef.current = el.scrollLeft
        // if in 'Tempo stimato' mode, disable text selection while panning
        if (showEstimatedOnly) {
          try {
            document.body.style.userSelect = 'none'
          } catch (err) {
            /* ignore */
          }
        }
      } else {
        return
      }
    }

    if (!isPanningRef.current) return
    const dx = e.clientX - panStartXRef.current
    const desired = panStartScrollRef.current - dx * PAN_SENSITIVITY
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    // clamp to bounds to avoid overscroll bounce
    el.scrollLeft = Math.min(maxScroll, Math.max(0, desired))
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current && !isPotentialPanRef.current) return
    isPanningRef.current = false
    isPotentialPanRef.current = false
    // cleanup dragstart listener if still present
    if (dragListenerRef.current) {
      document.removeEventListener('dragstart', dragListenerRef.current, true)
      dragListenerRef.current = null
    }
    // restore text selection if we disabled it
    try {
      document.body.style.userSelect = ''
    } catch (err) {
      /* ignore */
    }
    // restore touch-action and cursor
    try {
      const el = containerRef.current
      if (el) {
        el.style.touchAction = ''
        el.style.cursor = 'grab'
      }
    } catch (err) {
      /* ignore */
    }
    const target = e.target as HTMLElement
    try {
      target.releasePointerCapture?.(e.pointerId)
    } catch (err) {
      /* ignore */
    }
  }

  return (
    <div className="p-6">
      <header className="flex flex-col gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Board Kanban</h1>
          <p className="text-base text-slate-500 mt-1">Trascina i task tra le colonne per aggiornare lo stato</p>
        </div>
        <div className="flex flex-row items-center gap-3">
          <div className="relative flex-1 min-w-0 max-w-[48%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca task..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              type="button"
              onClick={() => setShowEstimatedOnly((prev) => !prev)}
              className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showEstimatedOnly
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock3 className="w-4 h-4" />
              <span>Tempo stimato</span>
            </button>
            <button
              onClick={() => openCreate('todo')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo task</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative">
        <div
          ref={containerRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="flex gap-6 overflow-x-auto pb-6 px-6 scrollbar-thin cursor-grab"
        >
          <div className="flex min-w-max gap-6">
            {COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={filteredTasks.filter((t) => t.status === status)}
                onTaskClick={openEdit}
                onAddTask={openCreate}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                draggingId={draggingId}
                onDragStart={setDraggingId}
              />
            ))}
          </div>
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        defaultStatus={defaultStatus}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTask(null)
        }}
      />
    </div>
  )
}
