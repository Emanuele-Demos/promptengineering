import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader, MobileNav } from './MobileNav'
import { NotificationCenter } from './NotificationCenter'

export function Layout() {
  return (
    <div className="flex min-h-screen min-h-[100dvh]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <div className="hidden lg:flex items-center justify-end border-b border-slate-200 bg-white/95 px-4 py-3">
          <NotificationCenter />
        </div>
        <main className="flex-1 overflow-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
