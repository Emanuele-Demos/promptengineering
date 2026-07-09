import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Kanban,
  Users,
  Zap,
} from 'lucide-react'
import { useApp } from '../store/AppContext'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/board', label: 'Board', icon: Kanban },
  { to: '/team', label: 'Team', icon: Users },
]

export function Sidebar() {
  const { stats } = useApp()

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              TeamFlow
            </h1>
            <p className="text-xs text-slate-500">Task Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
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
