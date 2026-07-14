import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronDown, Home, LayoutGrid, LogOut, Settings, UserCircle2, Users } from 'lucide-react'
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_38%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row lg:px-3 lg:py-3">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:flex">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">TeamFlow</p>
              <h1 className="text-xl font-semibold text-slate-900">Workspace</h1>
            </div>
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1.5 shadow-sm transition hover:shadow-md"
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
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur">
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
                className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Accedi
              </button>
            )}
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            <NavLink to="/" end className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/board" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <LayoutGrid className="h-4 w-4" />
              <span>Board</span>
            </NavLink>
            <NavLink to="/team" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <Users className="h-4 w-4" />
              <span>Team</span>
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <CalendarDays className="h-4 w-4" />
              <span>Calendar</span>
            </NavLink>
            <NavLink to="/gestione_stato" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <Settings className="h-4 w-4" />
              <span>Gestione Stato</span>
            </NavLink>
          </nav>

          {!user && (
            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setAuthOpen(true)
              }}
              className="mt-4 rounded-2xl border border-indigo-200 bg-white/80 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur"
            >
              Registrati
            </button>
          )}
        </aside>

        <div className="flex-1 lg:ml-3 lg:rounded-[32px] lg:border lg:border-white/60 lg:bg-white/55 lg:p-2 lg:shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)] lg:backdrop-blur-xl">
          <main className="min-h-screen px-3 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-6 lg:pb-6 lg:pt-6">
            <Outlet />
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/80 px-3 py-2 backdrop-blur-xl shadow-[0_-10px_40px_-20px_rgba(15,23,42,0.45)] lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-around gap-1">
              <NavLink to="/" end className={({ isActive }) => `flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
                <Home className="mb-1 h-4 w-4" />
                <span>Home</span>
              </NavLink>
              <NavLink to="/board" className={({ isActive }) => `flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
                <LayoutGrid className="mb-1 h-4 w-4" />
                <span>Board</span>
              </NavLink>
              <NavLink to="/team" className={({ isActive }) => `flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
                <Users className="mb-1 h-4 w-4" />
                <span>Team</span>
              </NavLink>
              <NavLink to="/calendar" className={({ isActive }) => `flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
                <CalendarDays className="mb-1 h-4 w-4" />
                <span>Cal.</span>
              </NavLink>
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <UserCircle2 className="mb-1 h-4 w-4" />
                  <span>Profilo</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login')
                    setAuthOpen(true)
                  }}
                  className="flex flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <UserCircle2 className="mb-1 h-4 w-4" />
                  <span>Accedi</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

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