import { useMemo, useState } from 'react'
import { Plus, Mail, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { TeamMember } from '../types'
import { useMembers } from '../hooks/useMembers'
import { useApp } from '../store/AppContext'
import { MemberAvatar } from '../components/MemberAvatar'

interface MemberForm {
  name: string
  email: string
  role: string
}

const emptyForm: MemberForm = { name: '', email: '', role: '' }

export function Team() {
  const {
    members,
    loading,
    error,
    saving,
    createMember,
    updateMember,
    deleteMember,
  } = useMembers()
  const { tasks, refreshData } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const activeTaskCountByMember = useMemo(() => {
    const counts = new Map<string, number>()
    for (const task of tasks) {
      if (!task.assigneeId || task.archived || task.status === 'done') continue
      counts.set(task.assigneeId, (counts.get(task.assigneeId) ?? 0) + 1)
    }
    return counts
  }, [tasks])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (member: TeamMember) => {
    setEditingId(member.id)
    setForm({ name: member.name, email: member.email, role: member.role })
    setFormError(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return

    setFormError(null)
    try {
      if (editingId) {
        await updateMember(editingId, form)
      } else {
        await createMember(form)
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
      await refreshData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    }
  }

  const handleDelete = async (member: TeamMember) => {
    const assigned = activeTaskCountByMember.get(member.id) ?? 0
    const msg =
      assigned > 0
        ? `${member.name} ha ${assigned} task assegnati. Rimuoverli comunque?`
        : `Rimuovere ${member.name} dal team?`
    if (!confirm(msg)) return

    try {
      await deleteMember(member.id)
      await refreshData()
    } catch {
      /* error shown via hook */
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <header className="flex flex-col gap-4 mb-6 lg:mb-8">
        <div className="hidden lg:block">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {loading ? 'Caricamento...' : `${members.length} membri · gestisci il tuo team di lavoro`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            onClick={openCreate}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex-1 sm:flex-none justify-center disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            Aggiungi membro
          </button>
        </div>
      </header>

      {error && (
        <div
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold text-slate-900">
            {editingId ? 'Modifica membro' : 'Nuovo membro'}
          </h3>
          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome completo"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nome@team.it"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Ruolo (es. Developer)"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
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
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              {editingId ? 'Salva' : 'Aggiungi'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" aria-hidden />
        </div>
      ) : members.length === 0 ? (
        <p className="text-center text-slate-500 py-16">Nessun membro nel team.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {members.map((member) => {
            const activeTasks = activeTaskCountByMember.get(member.id) ?? 0
            return (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <MemberAvatar name={member.name} color={member.color} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-sm text-indigo-600">{member.role}</p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1 break-all">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {`${activeTasks} task attivi`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      disabled={saving}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label={`Modifica ${member.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={saving}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      aria-label={`Elimina ${member.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
