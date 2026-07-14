import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function Projects() {
  const { projects, addProject, updateProject, deleteProject } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    addProject({ name: name.trim(), description: description.trim(), owner: 'Utente' })
    setName('')
    setDescription('')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Progetti</h1>
        <p className="text-sm text-slate-500 mt-1">Raggruppa i task in progetti e monitora il loro avanzamento.</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome progetto" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrizione" rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
        <button onClick={handleCreate} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
          <Plus className="w-4 h-4" /> Crea progetto
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-slate-900">{project.name}</h2>
              <button onClick={() => deleteProject(project.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input value={project.name} onChange={(e) => updateProject(project.id, { name: e.target.value })} className="mt-3 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <textarea value={project.description} onChange={(e) => updateProject(project.id, { description: e.target.value })} rows={3} className="mt-3 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
