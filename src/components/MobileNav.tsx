import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Kanban, Users, Zap } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/board', label: 'Board', icon: Kanban },
  { to: '/team', label: 'Team', icon: Users },
]

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/board': 'Board Kanban',
  '/team': 'Team',
}

export function MobileHeader() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'TeamFlow'

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3 safe-top">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 leading-none">TeamFlow</p>
        <h1 className="text-base font-bold text-slate-900 truncate">{title}</h1>
      </div>
    </header>
  )
}

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 safe-bottom">
      <div className="flex items-stretch justify-around px-2 pt-1 pb-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg min-w-[4.5rem] transition-colors ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
