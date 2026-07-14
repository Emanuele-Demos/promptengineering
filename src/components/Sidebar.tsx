import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Kanban,
  Users,
  Zap,
  ListChecks,
  FolderOpen,
  Target,
  FolderKanban,
  Archive,
  CalendarDays,
  LogOut,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../context/AuthContext'
import { NotificationBell } from './NotificationBell'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/board', label: 'Board', icon: Kanban },
  { to: '/archivio', label: 'Archivio', icon: Archive },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/gestione_stato', label: 'Gestione Stato', icon: ListChecks },
  { to: '/gestione_categorie', label: 'Categorie', icon: FolderOpen },
  { to: '/progetti', label: 'Progetti', icon: FolderKanban },
  { to: '/obiettivi', label: 'Obiettivi', icon: Target },
]

export function Sidebar() {
  const { stats, archivedTasks } = useApp()
  const { projects, loading: projectsLoading } = useProjects()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                TeamFlow
              </h1>
              <p className="text-xs text-slate-500">Task Management</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/progetti'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
            {to === '/archivio' && archivedTasks.length > 0 && (
              <span className="ml-auto px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                {archivedTasks.length}
              </span>
            )}
          </NavLink>
        ))}

        {!projectsLoading && projects.length > 0 && (
          <div className="pt-3 mt-2 border-t border-slate-100">
            <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              I tuoi progetti
            </p>
            {projects.slice(0, 8).map((project) => (
              <NavLink
                key={project.id}
                to={`/progetti/${project.id}`}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <span className="font-medium truncate block">{project.name}</span>
                <span className="text-[10px] text-slate-400">
                  {project.completedTasks}/{project.totalTasks} · {project.progress}%
                </span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Esci"
              title="Esci"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Riepilogo
          </p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <p className="text-lg font-bold text-slate-900">{stats.total}</p>
              <p className="text-[10px] text-slate-500">Task totali</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-100">
              <p className="text-lg font-bold text-emerald-600">{stats.done}</p>
              <p className="text-[10px] text-slate-500">Completati</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
