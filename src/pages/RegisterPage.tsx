import { Link } from 'react-router-dom'
import { ArrowLeft, Zap } from 'lucide-react'

export function RegisterPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Registrazione</h1>
        <p className="text-slate-500 mt-2 text-sm">
          La registrazione utenti sarà disponibile a breve. Per ora usa uno degli account demo
          del team.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna al login
        </Link>
      </div>
    </div>
  )
}
