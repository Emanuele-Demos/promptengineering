import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from '../api/projects.js'
import type { Project } from '../types'
import { ProjectProgressBar } from '../components/ProjectProgressBar'

type SortMode = 'name' | 'date'

export function GestioneProgetti() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('name')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await getProjects(search || undefined)) as Project[]
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(loadProjects, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadProjects, search])

  const sortedProjects = useMemo(() => {
    const list = [...projects]
    if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'it'))
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list
  }, [projects, sort])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Inserisci un nome per il progetto')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await updateProject(editingId, { name: trimmed, description: description.trim() })
        setSuccess('Progetto aggiornato con successo')
      } else {
        await createProject({ name: trimmed, description: description.trim() })
        setSuccess('Progetto creato con successo')
      }
      resetForm()
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingId(project.id)
    setName(project.name)
    setDescription(project.description)
    setSuccess('')
    setError('')
  }

  const handleDelete = async (project: Project) => {
    const msg =
      project.totalTasks > 0
        ? `Eliminare "${project.name}"? I ${project.totalTasks} task collegati resteranno senza progetto.`
        : `Eliminare il progetto "${project.name}"?`
    if (!confirm(msg)) return

    setError('')
    try {
      await deleteProject(project.id)
      if (editingId === project.id) resetForm()
      setSuccess('Progetto eliminato')
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FolderKanban className="w-7 h-7 text-indigo-600" />
          Progetti
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Raggruppa i task correlati e monitora l&apos;avanzamento complessivo.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          {editingId ? 'Modifica progetto' : 'Nuovo progetto'}
        </h2>
        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{success}</p>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Es. Sito Web Aziendale"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Breve descrizione del progetto..."
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {editingId ? 'Salva modifiche' : 'Crea progetto'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annulla
            </button>
          )}
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca progetto..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="name">Ordina per nome</option>
            <option value="date">Ordina per data</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Caricamento progetti...</p>
        ) : sortedProjects.length === 0 ? (
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
            Nessun progetto trovato. Creane uno per iniziare.
          </p>
        ) : (
          <div className="grid gap-4">
            {sortedProjects.map((project) => (
              <article
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:border-indigo-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link
                      to={`/progetti/${project.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-indigo-600"
                    >
                      📁 {project.name}
                    </Link>
                    {project.description && (
                      <p className="text-sm text-slate-500 mt-1">{project.description}</p>
                    )}
                    {project.isCompleted && (
                      <p className="text-sm text-emerald-600 font-medium mt-2">🎉 Progetto completato</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(project)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                      title="Modifica"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <ProjectProgressBar
                  progress={project.progress}
                  completedTasks={project.completedTasks}
                  totalTasks={project.totalTasks}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
