import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react'
import { AuthModal } from './AuthModal'

export function Layout() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('teamflow-auth')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed.user ?? null)
      } catch {
        setUser(null)
      }
    }
  }, [])

  return (
    <div className="flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-100 min-h-screen p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">TeamFlow</h1>
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                  {user.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="rounded-xl bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/profile')
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      Profilo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/settings')
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Settings className="h-4 w-4" />
                      Impostazioni
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('teamflow-auth')
                        setUser(null)
                        setMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setAuthOpen(true)
              }}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Accedi
            </button>
          )}
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink to="/" className="menu-item">
            Dashboard
          </NavLink>

          <NavLink to="/board" className="menu-item">
            Board
          </NavLink>

          <NavLink to="/team" className="menu-item">
            Team
          </NavLink>

          <NavLink to="/calendar" className="menu-item">
            📅 Calendar
          </NavLink>

          <NavLink to="/gestione_stato" className="menu-item">
            Gestione Stato
          </NavLink>
        </nav>

        {!user && (
          <button
            type="button"
            onClick={() => {
              setAuthMode('register')
              setAuthOpen(true)
            }}
            className="mt-4 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Registrati
          </button>
        )}
      </aside>

      {/* CONTENUTO */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser)
          setAuthOpen(false)
        }}
        onSwitchMode={(nextMode) => setAuthMode(nextMode)}
      />
    </div>
  )
}