import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'

export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4f46e5')

  const handleCreate = () => {
    if (!name.trim()) return
    addCategory({ name: name.trim(), color })
    setName('')
    setColor('#4f46e5')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Gestione categorie</h1>
        <p className="text-sm text-slate-500 mt-1">Crea, modifica ed elimina categorie per organizzare i task.</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuova categoria" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded-lg border border-slate-200 bg-white" />
          <button onClick={handleCreate} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                <h2 className="font-semibold text-slate-900">{category.name}</h2>
              </div>
              <button onClick={() => deleteCategory(category.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <input value={category.name} onChange={(e) => updateCategory(category.id, { name: e.target.value })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input type="color" value={category.color} onChange={(e) => updateCategory(category.id, { color: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
