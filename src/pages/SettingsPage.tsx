import { ArrowLeft, Bell, Lock, Palette, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Impostazioni</h1>
          <p className="text-sm text-slate-500">Personalizza il comportamento e l’esperienza del tuo account.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Notifiche</h2>
              <p className="text-sm text-slate-500">Ricevi aggiornamenti sui task assegnati.</p>
            </div>
          </div>
          <label className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-700">Abilita notifiche email</span>
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" defaultChecked />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Sicurezza</h2>
              <p className="text-sm text-slate-500">Gestisci password e accessi.</p>
            </div>
          </div>
          <button className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cambia password
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Tema</h2>
              <p className="text-sm text-slate-500">Scegli il tema dell’interfaccia.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Scuro</button>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Chiaro</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Privacy</h2>
              <p className="text-sm text-slate-500">Controlla i dati condivisi con il team.</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">Le tue informazioni sono gestite in modo sicuro all’interno dell’app.</p>
        </div>
      </div>
    </div>
  )
}
