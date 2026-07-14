import { useState } from 'react'
import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Project } from '../types'
import { useApp } from '../store/AppContext'

interface ProjectForm {
  name: string
  description: string
  owner: string
}

const emptyForm: ProjectForm = { name: '', description: '', owner: '' }

export function Projects() {
  const { projects, tasks, addProject, updateProject, deleteProject } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProjectForm>(emptyForm)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (project: Project) => {
    setEditingId(project.id)
    setForm({
      name: project.name,
      description: project.description,
      owner: project.owner,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return

    const payload = {
      name,
      description: form.description.trim(),
      owner: form.owner.trim(),
    }

    if (editingId) {
      updateProject(editingId, payload)
    } else {
      addProject(payload)
    }

    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = (project: Project) => {
    const assigned = tasks.filter((task) => task.projectId === project.id).length
    const message =
      assigned > 0
        ? `Il progetto "${project.name}" contiene ${assigned} task. Eliminarlo comunque? I task resteranno senza progetto.`
        : `Eliminare il progetto "${project.name}"?`

    if (confirm(message)) {
      deleteProject(project.id)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Progetti</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Raggruppa i task e controlla l'avanzamento operativo
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Nuovo progetto
          </button>
        </div>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold text-slate-900">
            {editingId ? 'Modifica progetto' : 'Nuovo progetto'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome progetto"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Owner"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrizione"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {editingId ? 'Salva' : 'Aggiungi'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project) => {
          const projectTasks = tasks.filter((task) => task.projectId === project.id)
          const completed = projectTasks.filter((task) => task.status === 'done').length
          const total = projectTasks.length
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <section
              key={project.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{project.description}</p>
                      {project.owner && (
                        <p className="text-xs text-indigo-600 mt-2">Owner: {project.owner}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(project)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Modifica progetto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina progetto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{completed}/{total} task completati</span>
                      <span className="font-semibold text-slate-700">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    {projectTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm">
                        <span className={task.status === 'done' ? 'text-emerald-600' : 'text-slate-400'}>
                          {task.status === 'done' ? '✓' : '□'}
                        </span>
                        <span className={task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {projectTasks.length === 0 && (
                      <p className="text-sm text-slate-400">Nessun task assegnato</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
