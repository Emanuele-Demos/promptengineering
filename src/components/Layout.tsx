import { Outlet, NavLink } from 'react-router-dom'
import { NotificationCenter } from './NotificationCenter'
import { useApp } from '../store/AppContext'

export function Layout() {
  const { projects, tasks } = useApp()

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

          <NavLink to="/projects" className="menu-item">
            Progetti
          </NavLink>

          <NavLink to="/categories" className="menu-item">
            Categorie
          </NavLink>

          <NavLink to="/archive" className="menu-item">
            Archivio
          </NavLink>

          <NavLink to="/calendar" className="menu-item">
            📅 Calendar
          </NavLink>

          <NavLink to="/gestione_stato" className="menu-item">
            Gestione Stato
          </NavLink>
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
            📁 Progetti
          </p>
          <div className="space-y-2">
            {projects.slice(0, 6).map((project) => {
              const projectTasks = tasks.filter((task) => task.projectId === project.id)
              const done = projectTasks.filter((task) => task.status === 'done').length
              const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0

              return (
                <NavLink
                  key={project.id}
                  to="/projects"
                  className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{project.name}</span>
                    <span className="text-[10px] text-slate-500">{progress}%</span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
                  </div>
                </NavLink>
              )
            })}
          </div>
        </div>
      </aside>

      {/* CONTENUTO */}
      <main className="flex-1 p-6">
        <NotificationCenter />
        <Outlet />
      </main>
    </div>
  )
}
