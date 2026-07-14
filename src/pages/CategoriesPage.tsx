import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import type { Category } from '../types'

interface CategoryFormState {
  name: string
  color: string
}

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16', '#EC4899']

const emptyForm = (): CategoryFormState => ({ name: '', color: PRESET_COLORS[0] })

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm())
  const [error, setError] = useState('')

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError('')
    setShowForm(true)
  }

  const openEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({ name: category.name, color: category.color })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Il nome è obbligatorio')
      return
    }

    if (editingId) {
      updateCategory(editingId, { name: form.name.trim(), color: form.color })
    } else {
      addCategory({ name: form.name.trim(), color: form.color })
    }

    setShowForm(false)
    setForm(emptyForm())
    setEditingId(null)
    setError('')
  }

  const handleDelete = (category: Category) => {
    if (confirm(`Eliminare la categoria “${category.name}”?`)) {
      deleteCategory(category.id)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-6 lg:mb-8">
        <div className="hidden lg:block">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Categorie dei task</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Organizza i task in categorie personalizzate e mantieni tutto ordinato.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuova categoria
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-900">
            {editingId ? 'Modifica categoria' : 'Nuova categoria'}
          </h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Es. Lavoro"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Colore</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`h-9 w-9 rounded-full border-2 transition-all ${form.color === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Seleziona colore ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Salva
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {sortedCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.color}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(category)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
