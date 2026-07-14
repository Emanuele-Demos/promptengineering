import { Bell } from 'lucide-react'
import { Outlet, NavLink } from 'react-router-dom'
import { useApp } from '../store/AppContext'

export function Layout() {
  const { unreadNotifications } = useApp()

  return (
    <div className="flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-100 min-h-screen p-4">
        <h1 className="text-xl font-bold mb-6">TeamFlow</h1>

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

          <NavLink to="/categories" className="menu-item">
            Categorie
          </NavLink>

          <NavLink to="/notifications" className="menu-item flex items-center justify-between">
            <span>Notifiche</span>
            {unreadNotifications > 0 ? (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                {unreadNotifications}
              </span>
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </NavLink>

          <NavLink to="/goals" className="menu-item">
            Obiettivi
          </NavLink>

          <NavLink to="/goal-history" className="menu-item">
            Storico obiettivi
          </NavLink>
        </nav>
      </aside>

      {/* CONTENUTO */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}