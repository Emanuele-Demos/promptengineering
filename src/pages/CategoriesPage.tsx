import { useState } from 'react'
import { Plus, Trash2, Palette } from 'lucide-react'
import { useApp } from '../store/AppContext'

const DEFAULT_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLORS[0])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    addCategory({ name: name.trim(), color })
    setName('')
    setColor(DEFAULT_COLORS[0])
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestione categorie</h1>
        <p className="text-sm text-slate-500 mt-1">Crea, modifica ed elimina categorie per organizzare i task.</p>
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
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded-lg border border-slate-200 bg-white p-1"
              />
              <span className="text-sm text-slate-500">{color}</span>
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

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                <div>
                  <h2 className="font-semibold text-slate-900">{category.name}</h2>
                  <p className="text-xs text-slate-500">Colore personalizzato</p>
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

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="text-sm text-slate-600 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => updateCategory(category.id, { color: e.target.value })}
                  className="h-8 w-10 rounded border border-slate-200 bg-white p-1"
                />
              </label>
              <input
                value={category.name}
                onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
