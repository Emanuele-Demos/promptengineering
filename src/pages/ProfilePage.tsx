import { ArrowLeft, Briefcase, Mail, Palette, UserCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() {
  const { user } = useAuth()
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Non disponibile'
  const lastName = user?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'Non disponibile'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profilo</h1>
          <p className="text-sm text-slate-500">Gestisci i dati principali del tuo account.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white"
            style={{ backgroundColor: user?.color || '#6366f1' }}
          >
            {user?.name
              ? user.name
                  .split(' ')
                  .map((part: string) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.name ?? 'Utente'}</h2>
            <p className="text-sm text-slate-500">Ruolo: {user?.role ?? 'Non disponibile'}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserCircle2 className="h-4 w-4" />
              Nome
            </div>
            <p className="mt-2 text-sm text-slate-800">{firstName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserCircle2 className="h-4 w-4" />
              Cognome
            </div>
            <p className="mt-2 text-sm text-slate-800">{lastName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserCircle2 className="h-4 w-4" />
              Nome completo
            </div>
            <p className="mt-2 text-sm text-slate-800">{user?.name ?? 'Non disponibile'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <p className="mt-2 text-sm text-slate-800">{user?.email ?? 'Non disponibile'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Briefcase className="h-4 w-4" />
              Ruolo
            </div>
            <p className="mt-2 text-sm text-slate-800">{user?.role ?? 'Non disponibile'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Palette className="h-4 w-4" />
              Tema pagina
            </div>
            <p className="mt-2 text-sm text-slate-800">Configuralo nelle impostazioni account.</p>
            <Link to="/settings" className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Apri impostazioni
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
