import { useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { Task } from '../types'

const PRESET_COLORS = [
  { value: '#6366f1', label: 'Indaco' },
  { value: '#8b5cf6', label: 'Viola' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f43f5e', label: 'Corallo' },
  { value: '#f97316', label: 'Arancio' },
  { value: '#f59e0b', label: 'Giallo ambra' },
  { value: '#eab308', label: 'Giallo' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#10b981', label: 'Verde acqua' },
  { value: '#14b8a6', label: 'Turquoise' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#3b82f6', label: 'Blu' },
  { value: '#60a5fa', label: 'Blu chiaro' },
  { value: '#a855f7', label: 'Porpora' },
  { value: '#64748b', label: 'Grigio' },
]

export function CategoriesPage() {
  const { categories, tasks, addCategory, updateCategory, updateTask, deleteCategory } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0].value)
  const [showColorMenu, setShowColorMenu] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<string | null>(null)
  const [dropTargetTaskId, setDropTargetTaskId] = useState<string | null>(null)
  const [dropPulseCategoryId, setDropPulseCategoryId] = useState<string | null>(null)

  const selectedColor = PRESET_COLORS.find((item) => item.value === color) ?? PRESET_COLORS[0]

  const handleColorSelect = (nextColor: string) => {
    setColor(nextColor)
    setShowColorMenu(false)
  }

  const tasksByCategory = useMemo(() => {
    const grouped = new Map<string, Task[]>()

    categories.forEach((category) => grouped.set(category.id, []))

    tasks.forEach((task) => {
      if (task.categoryId) {
        const list = grouped.get(task.categoryId)
        if (list) {
          list.push(task)
        }
      }
    })

    grouped.forEach((list, categoryId) => {
      list.sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0)
        return orderDiff !== 0 ? orderDiff : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
      grouped.set(categoryId, list)
    })

    return grouped
  }, [categories, tasks])

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    addCategory({ name: name.trim(), color })
    setName('')
    setColor(PRESET_COLORS[0].value)
    setShowColorMenu(false)
  }

  const updateCategoryOrder = (destinationCategoryId: string, targetTaskId?: string | null) => {
    if (!draggedTaskId) return

    const draggedTask = tasks.find((task) => task.id === draggedTaskId)
    if (!draggedTask) return

    const sourceCategoryId = draggedTask.categoryId ?? null

    const getCategoryTasks = (categoryId: string | null) =>
      tasks
        .filter((task) => task.categoryId === categoryId)
        .filter((task) => task.id !== draggedTaskId)
        .sort((a, b) => {
          const orderDiff = (a.order ?? 0) - (b.order ?? 0)
          return orderDiff !== 0 ? orderDiff : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })

    const destinationTasks = getCategoryTasks(destinationCategoryId)
    const insertIndex = targetTaskId
      ? destinationTasks.findIndex((task) => task.id === targetTaskId)
      : destinationTasks.length

    const destinationIds = [...destinationTasks]
    if (insertIndex >= 0) {
      destinationIds.splice(insertIndex, 0, draggedTask)
    } else {
      destinationIds.push(draggedTask)
    }

    const sourceIds = getCategoryTasks(sourceCategoryId)

    const applyOrdering = (categoryId: string | null, orderedTasks: Task[]) => {
      orderedTasks.forEach((task, index) => {
        updateTask(task.id, {
          categoryId,
          order: index,
        })
      })
    }

    if (sourceCategoryId === destinationCategoryId) {
      applyOrdering(destinationCategoryId, destinationIds)
    } else {
      applyOrdering(sourceCategoryId, sourceIds)
      applyOrdering(destinationCategoryId, destinationIds)
    }

    setDraggedTaskId(null)
    setDropTargetCategoryId(null)
    setDropTargetTaskId(null)
    setDropPulseCategoryId(destinationCategoryId)
    window.setTimeout(() => setDropPulseCategoryId(null), 180)
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, taskId: string) => {
    event.dataTransfer.effectAllowed = 'move'
    setDraggedTaskId(taskId)
  }

  const handleDrop = (categoryId: string, targetTaskId?: string | null) => {
    updateCategoryOrder(categoryId, targetTaskId)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestione categorie</h1>
        <p className="text-sm text-slate-500 mt-1">Crea categorie e organizza i task direttamente sotto ogni sezione.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_auto]">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome categoria</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Es. Università"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Colore</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorMenu((value) => !value)}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span
                  className="h-5 w-5 rounded-full border border-slate-200"
                  style={{ backgroundColor: selectedColor.value }}
                />
                <span className="text-slate-600">{selectedColor.label}</span>
              </button>
              {showColorMenu && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_COLORS.map((presetColor) => {
                      const isSelected = color === presetColor.value

                      return (
                        <button
                          key={presetColor.value}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleColorSelect(presetColor.value)}
                          className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] transition ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                          title={presetColor.label}
                        >
                          <span
                            className="h-5 w-5 rounded-full border border-slate-200"
                            style={{ backgroundColor: presetColor.value }}
                          />
                          <span className="text-[10px] text-slate-600">{presetColor.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => {
          const categoryTasks = tasksByCategory.get(category.id) ?? []
          const isDropTarget = dropTargetCategoryId === category.id
          const isPulse = dropPulseCategoryId === category.id

          return (
            <div
              key={category.id}
              className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${isDropTarget ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'} ${isPulse ? 'animate-pulse' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDropTargetCategoryId(category.id)
                setDropTargetTaskId(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                handleDrop(category.id)
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-slate-200" style={{ backgroundColor: category.color }} />
                  <div>
                    <h2 className="font-semibold text-slate-900">{category.name}</h2>
                    <p className="text-xs text-slate-500">Trascina i task per riordinarli o spostarli</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Elimina categoria"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                <input
                  value={category.name}
                  onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-4 min-h-[96px] rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-2">
                {categoryTasks.length === 0 ? (
                  <div className="flex h-full min-h-[72px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/80 px-3 text-center text-xs text-slate-400">
                    Drag here
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryTasks.map((task) => {
                      const isActiveTask = draggedTaskId === task.id
                      const isTargetTask = dropTargetTaskId === task.id && dropTargetCategoryId === category.id

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(event) => handleDragStart(event, task.id)}
                          onDragOver={(event) => {
                            event.preventDefault()
                            setDropTargetCategoryId(category.id)
                            setDropTargetTaskId(task.id)
                          }}
                          onDrop={(event) => {
                            event.preventDefault()
                            handleDrop(category.id, task.id)
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null)
                            setDropTargetCategoryId(null)
                            setDropTargetTaskId(null)
                          }}
                          className={`rounded-lg border bg-white p-2.5 shadow-sm transition-all ${isActiveTask ? 'opacity-50' : ''} ${isTargetTask ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{task.title}</p>
                              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                                {task.priority}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                              {task.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
