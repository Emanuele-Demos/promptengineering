import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'
import { getProject } from '../api/projects.js'
import { useApp } from '../store/AppContext'
import { useCategories } from '../hooks/useCategories'
import type { Project, Task } from '../types'
import { ProjectProgressBar } from '../components/ProjectProgressBar'
import { PriorityBadge } from '../components/PriorityBadge'
import { CategoryBadge } from '../components/CategoryBadge'
import { formatDate } from '../utils/helpers'
import { STATUS_LABELS } from '../types'

type TaskSort = 'priority' | 'category' | 'dueDate'
type TaskFilter = 'all' | 'open' | 'done'

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }

export function DettaglioProgetto() {
  const { id } = useParams<{ id: string }>()
  const { tasks } = useApp()
  const { getCategoryById } = useCategories()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<TaskSort>('dueDate')
  const [filter, setFilter] = useState<TaskFilter>('all')

  const loadProject = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = (await getProject(id)) as Project
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const localTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id),
    [tasks, id]
  )

  const stats = useMemo(() => {
    const total = localTasks.length
    const completed = localTasks.filter((t) => t.status === 'done').length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, progress, isCompleted: total > 0 && completed === total }
  }, [localTasks])

  const displayTasks = useMemo(() => {
    let list: Task[] = localTasks.length > 0 ? [...localTasks] : [...(project?.tasks ?? [])].map((t) => ({
      id: t.id,
      title: t.title,
      description: '',
      notes: '',
      links: [],
      attachments: [],
      status: t.status,
      priority: t.priority,
      assigneeId: null,
      categoryId: t.categoryId,
      projectId: id ?? null,
      dueDate: t.dueDate,
      reminderDate: null,
      reminderType: null,
      tags: [],
      createdAt: '',
      updatedAt: '',
    }))

    if (filter === 'open') list = list.filter((t) => t.status !== 'done')
    if (filter === 'done') list = list.filter((t) => t.status === 'done')

    list.sort((a, b) => {
      if (sort === 'priority') {
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
      }
      if (sort === 'category') {
        const ca = getCategoryById(a.categoryId)?.name ?? ''
        const cb = getCategoryById(b.categoryId)?.name ?? ''
        return ca.localeCompare(cb, 'it')
      }
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return da - db
    })

    return list
  }, [localTasks, project?.tasks, filter, sort, getCategoryById, id])

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">Caricamento progetto...</div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <p className="text-red-600 mb-4">{error || 'Progetto non trovato'}</p>
        <Link to="/progetti" className="text-indigo-600 text-sm hover:underline">
          ← Torna ai progetti
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <Link to="/progetti" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Tutti i progetti
      </Link>

      <header className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">📁 {project.name}</h1>
        {project.description && <p className="text-slate-600">{project.description}</p>}
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span>Proprietario: {project.owner?.name ?? project.ownerId}</span>
          <span>
            Creato: {new Date(project.createdAt).toLocaleDateString('it-IT')}
          </span>
        </div>
        {stats.isCompleted && (
          <p className="text-emerald-600 font-semibold">🎉 Progetto completato</p>
        )}
        <ProjectProgressBar
          progress={stats.total > 0 ? stats.progress : project.progress}
          completedTasks={stats.total > 0 ? stats.completed : project.completedTasks}
          totalTasks={stats.total > 0 ? stats.total : project.totalTasks}
        />
      </header>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Task del progetto</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TaskFilter)}
              className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
            >
              <option value="all">Tutti</option>
              <option value="open">Aperti</option>
              <option value="done">Completati</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as TaskSort)}
              className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
            >
              <option value="dueDate">Scadenza</option>
              <option value="priority">Priorità</option>
              <option value="category">Categoria</option>
            </select>
          </div>
        </div>

        <ul className="divide-y divide-slate-100">
          {displayTasks.length === 0 ? (
            <li className="p-6 text-sm text-slate-500 text-center">
              Nessun task in questo progetto. Assegna un task dal form di creazione/modifica.
            </li>
          ) : (
            displayTasks.map((task) => {
              const category = getCategoryById(task.categoryId)
              const done = task.status === 'done'
              return (
                <li key={task.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-slate-500">
                        {STATUS_LABELS[task.status]}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      {category && <CategoryBadge category={category} />}
                      {task.dueDate && (
                        <span className="text-[11px] text-slate-500">
                          Scadenza: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </section>
    </div>
  )
}
