import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, Lock, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('teamflow-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem('teamflow-theme', theme)
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-[calc(100vh-7rem)] rounded-3xl p-4 sm:p-5 ${isDark ? 'bg-slate-950/35' : 'bg-white/35'}`}>
      <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className={`rounded-full p-2 ${isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Impostazioni</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Material UX: controlla profilo, sicurezza, notifiche e tema.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className={`rounded-3xl border p-5 shadow-lg ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Notifiche</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ricevi aggiornamenti sui task assegnati.
              </p>
            </div>
          </div>
          <label className={`mt-4 flex items-center justify-between rounded-2xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Abilita notifiche email</span>
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" defaultChecked />
          </label>
        </div>

        <div className={`rounded-3xl border p-5 shadow-lg ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Sicurezza</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gestisci password e accessi.</p>
            </div>
          </div>
          <button
            type="button"
            className={`mt-4 rounded-xl border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Cambia password
          </button>
        </div>

        <div className={`rounded-3xl border p-5 shadow-lg ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Privacy</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Controlla i dati condivisi con il team.</p>
            </div>
          </div>
          <p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Le tue informazioni sono gestite in modo sicuro all'interno dell'app.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
