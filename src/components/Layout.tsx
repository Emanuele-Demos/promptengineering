import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader, MobileNav } from './MobileNav'
import { TaskModal } from './TaskModal'
import { useApp } from '../store/AppContext'

export function Layout() {
  const { selectedTask, isModalOpen, closeModal, defaultStatus } = useApp()

  return (
    <div className="flex min-h-screen min-h-[100dvh]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 overflow-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      <TaskModal
        task={selectedTask}
        defaultStatus={defaultStatus}
        open={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}
