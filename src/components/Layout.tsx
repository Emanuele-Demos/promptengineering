import { Outlet, NavLink } from 'react-router-dom'

export function Layout() {
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
        </nav>
      </aside>

      {/* CONTENUTO */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}