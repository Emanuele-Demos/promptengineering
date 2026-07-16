import { useCallback, useEffect, useState } from 'react'
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../api/api.js'
import type { Category } from '../types'

const DEFAULT_COLOR = '#3B82F6'

const PRESET_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#6366F1',
]

function sanitizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function GestioneCategorie() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await getCategories()) as Category[]
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setColor(DEFAULT_COLOR)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = sanitizeName(name)
    if (!trimmedName) {
      setError('Inserisci un nome per la categoria')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await updateCategory(editingId, { name: trimmedName, color })
        setSuccess('Categoria aggiornata con successo')
      } else {
        await createCategory({ name: trimmedName, color })
        setSuccess('Categoria creata con successo')
      }
      resetForm()
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setName(category.name)
    setColor(category.color)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (category: Category) => {
    const taskInfo =
      category.taskCount && category.taskCount > 0
        ? `\n\nI ${category.taskCount} task associati perderanno la categoria (categoryId impostato a null).`
        : ''

    if (!confirm(`Eliminare la categoria "${category.name}"?${taskInfo}`)) return

    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await deleteCategory(category.id)
      if (editingId === category.id) resetForm()
      setSuccess('Categoria eliminata con successo')
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <FolderOpen className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Gestione Categorie</h1>
        </div>
        <p className="text-sm text-slate-500">
          Crea categorie personalizzate con nome e colore per organizzare i tuoi task.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 mb-8"
      >
        <h2 className="text-sm font-semibold text-slate-700">
          {editingId ? 'Modifica categoria' : 'Nuova categoria'}
        </h2>

        <div>
          <label htmlFor="category_name" className="block text-sm font-medium text-slate-700 mb-1">
            Nome *
          </label>
          <input
            id="category_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Lavoro"
            maxLength={100}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="category_color" className="block text-sm font-medium text-slate-700 mb-1">
            Colore *
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="category_color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              pattern="^#[0-9A-Fa-f]{6}$"
              className="flex-1 min-w-[8rem] px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              Anteprima
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === preset ? 'border-slate-900 scale-110' : 'border-white shadow-sm'
                }`}
                style={{ backgroundColor: preset }}
                title={preset}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {submitting
              ? 'Salvataggio...'
              : editingId
                ? 'Salva modifiche'
                : 'Crea categoria'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annulla modifica
            </button>
          )}
        </div>
      </form>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Categorie ({categories.length})
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Caricamento...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuna categoria presente.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 p-3 border border-slate-100 rounded-lg bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{category.name}</p>
                    <p className="text-xs text-slate-500">
                      {category.taskCount ?? 0} task associati · {category.color}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={submitting}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
