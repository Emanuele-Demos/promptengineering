import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Category } from '../types'
import { useApp } from '../store/AppContext'

interface CategoryForm {
  name: string
  color: string
}

const emptyForm: CategoryForm = { name: '', color: '#6366f1' }

export function Categories() {
  const { categories, tasks, addCategory, updateCategory, deleteCategory } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({ name: category.name, color: category.color })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return

    if (editingId) {
      updateCategory(editingId, { name, color: form.color })
    } else {
      addCategory({ name, color: form.color })
    }

    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = (category: Category) => {
    const assigned = tasks.filter((task) => task.categoryId === category.id).length
    const message =
      assigned > 0
        ? `La categoria "${category.name}" e assegnata a ${assigned} task. Rimuoverla comunque?`
        : `Eliminare la categoria "${category.name}"?`

    if (confirm(message)) {
      deleteCategory(category.id)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Categorie
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {categories.length} categorie per organizzare i task
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Nuova categoria
          </button>
        </div>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold text-slate-900">
            {editingId ? 'Modifica categoria' : 'Nuova categoria'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome categoria"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white">
              <span className="text-sm text-slate-600">Colore</span>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-9 h-7 p-0 border-0 bg-transparent cursor-pointer"
                title="Colore categoria"
              />
            </label>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {categories.map((category) => {
          const assignedTasks = tasks.filter((task) => task.categoryId === category.id).length

          return (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <span
                  className="w-10 h-10 rounded-lg shrink-0 border border-slate-200"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {assignedTasks} task assegnati
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-mono">
                    {category.color}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(category)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Modifica categoria"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Elimina categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
