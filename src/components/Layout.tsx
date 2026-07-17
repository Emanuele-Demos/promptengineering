import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronDown, Home, LayoutGrid, LogOut, Settings, UserCircle2, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserAvatar, type UserAvatarSelection } from '../utils/userAvatar'

export function Layout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatar, setAvatar] = useState<UserAvatarSelection | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const savedTheme = localStorage.getItem('teamflow-theme')
    document.documentElement.classList.toggle('theme-dark', savedTheme === 'dark')
  }, [])

  useEffect(() => {
    if (!user) {
      setAvatar(null)
      return
    }

    const syncAvatar = () => setAvatar(getUserAvatar(user.id))
    syncAvatar()
    window.addEventListener('teamflow-avatar-updated', syncAvatar)
    return () => window.removeEventListener('teamflow-avatar-updated', syncAvatar)
  }, [user])

  return (
    <div className="app-layout-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_38%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row lg:px-3 lg:py-3">
        <aside className="hidden w-72 shrink-0 flex-col rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:flex">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">TeamFlow</p>
              <h1 className="text-xl font-semibold text-slate-900">Workspace</h1>
            </div>
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
            <NavLink to="/calendario" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <CalendarDays className="h-4 w-4" />
              <span>Calendar</span>
            </NavLink>
            <NavLink to="/gestione_stato" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <Settings className="h-4 w-4" />
              <span>Gestione Stato</span>
            </NavLink>
          </nav>

          {user ? (
            <div className="relative mt-4 border-t border-slate-200/70 pt-4">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                  {avatar?.type === 'image' ? (
                    <img src={avatar.value} alt="Avatar utente" className="h-full w-full object-cover" />
                  ) : avatar?.type === 'preset' ? (
                    <span>{avatar.value}</span>
                  ) : (
                    user.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
              </button>

              {menuOpen && (
                <div className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-20 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur">
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
                      className="desktop-user-menu-item flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700"
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
                      className="desktop-user-menu-item flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700"
                    >
                      <Settings className="h-4 w-4" />
                      Impostazioni
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        setMenuOpen(false)
                        navigate('/login', { replace: true })
                      }}
                      className="desktop-user-menu-item desktop-user-menu-item--danger flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

        </aside>

        <div className="app-main-shell flex-1 lg:ml-3 lg:rounded-[32px] lg:border lg:border-white/60 lg:bg-white/55 lg:p-2 lg:shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)] lg:backdrop-blur-xl">
          <main className="app-main-content min-h-screen px-3 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-6 lg:pb-6 lg:pt-6">
            <Outlet />
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/80 px-3 py-2 backdrop-blur-xl shadow-[0_-10px_40px_-20px_rgba(15,23,42,0.45)] lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-around gap-1.5">
              <NavLink to="/" end className={({ isActive }) => `mobile-nav-item flex flex-1 flex-col items-center rounded-2xl border px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${isActive ? 'mobile-nav-item--active' : 'border-transparent text-slate-500'}`}>
                <Home className="mb-1 h-4 w-4" />
                <span>Home</span>
              </NavLink>
              <NavLink to="/board" className={({ isActive }) => `mobile-nav-item flex flex-1 flex-col items-center rounded-2xl border px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${isActive ? 'mobile-nav-item--active' : 'border-transparent text-slate-500'}`}>
                <LayoutGrid className="mb-1 h-4 w-4" />
                <span>Board</span>
              </NavLink>
              <NavLink to="/team" className={({ isActive }) => `mobile-nav-item flex flex-1 flex-col items-center rounded-2xl border px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${isActive ? 'mobile-nav-item--active' : 'border-transparent text-slate-500'}`}>
                <Users className="mb-1 h-4 w-4" />
                <span>Team</span>
              </NavLink>
              <NavLink to="/calendario" className={({ isActive }) => `mobile-nav-item flex flex-1 flex-col items-center rounded-2xl border px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${isActive ? 'mobile-nav-item--active' : 'border-transparent text-slate-500'}`}>
                <CalendarDays className="mb-1 h-4 w-4" />
                <span>Cal.</span>
              </NavLink>
              {user ? (
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `mobile-nav-item flex flex-1 flex-col items-center rounded-2xl border px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${isActive ? 'mobile-nav-item--active' : 'border-transparent text-slate-500'}`}
                >
                  <div className="mb-1 flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[9px] font-semibold text-white">
                    {avatar?.type === 'image' ? (
                      <img src={avatar.value} alt="Avatar utente" className="h-full w-full object-cover" />
                    ) : avatar?.type === 'preset' ? (
                      <span>{avatar.value}</span>
                    ) : (
                      user.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <span>Profilo</span>
                </NavLink>
              ) : null}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}