import { useMemo, useState } from 'react'
import { X, Mail, Lock, User } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  mode: 'login' | 'register'
  onClose: () => void
  onLoginSuccess: (user: { id: string; name: string; email: string }) => void
  onSwitchMode: (mode: 'login' | 'register') => void
}

interface FormState {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function AuthModal({ open, mode, onClose, onLoginSuccess, onSwitchMode }: AuthModalProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const title = useMemo(() => (mode === 'register' ? 'Crea il tuo account' : 'Accedi al tuo account'), [mode])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const storedUsers = JSON.parse(localStorage.getItem('teamflow-users') ?? '[]') as Array<{ id: string; name: string; email: string; password: string }>

    if (mode === 'register') {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        setError('Compila tutti i campi richiesti.')
        return
      }

      if (form.password.length < 6) {
        setError('La password deve avere almeno 6 caratteri.')
        return
      }

      if (form.password !== form.confirmPassword) {
        setError('Le password non coincidono.')
        return
      }

      const alreadyExists = storedUsers.some((user) => user.email.toLowerCase() === form.email.toLowerCase())
      if (alreadyExists) {
        setError('Questa email è già registrata.')
        return
      }

      const newUser = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }

      storedUsers.push(newUser)
      localStorage.setItem('teamflow-users', JSON.stringify(storedUsers))
      localStorage.setItem('teamflow-auth', JSON.stringify({ user: { id: newUser.id, name: newUser.name, email: newUser.email } }))
      setSuccess(`Email di conferma inviata a ${newUser.email}.`) 
      onLoginSuccess({ id: newUser.id, name: newUser.name, email: newUser.email })
      setForm(initialForm)
      return
    }

    if (!form.email.trim() || !form.password.trim()) {
      setError('Inserisci email e password.')
      return
    }

    const user = storedUsers.find((item) => item.email.toLowerCase() === form.email.toLowerCase() && item.password === form.password)
    if (!user) {
      setError('Credenziali non valide.')
      return
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email }
    localStorage.setItem('teamflow-auth', JSON.stringify({ user: sessionUser }))
    setSuccess('Accesso effettuato con successo.')
    onLoginSuccess(sessionUser)
    setForm(initialForm)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">Gestisci accesso e registrazione in modo semplice.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {mode === 'register' && (
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Nome e cognome"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Email"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Password"
            />
          </div>

          {mode === 'register' && (
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Conferma password"
              />
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            {mode === 'register' ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <div className="border-t border-slate-200 px-5 py-4 text-center text-sm text-slate-600">
          {mode === 'register' ? 'Hai già un account?' : 'Non hai un account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setError('')
              setSuccess('')
              setForm(initialForm)
              onSwitchMode(mode === 'register' ? 'login' : 'register')
            }}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {mode === 'register' ? 'Accedi' : 'Registrati'}
          </button>
        </div>
      </div>
    </div>
  )
}
