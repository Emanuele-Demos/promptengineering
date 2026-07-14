import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Board } from './pages/Board'
import { Team } from './pages/Team'
import { CalendarPage } from './pages/CalendarPage'
import { GestioneStato } from './pages/GestioneStato'
import { CategoriesPage } from './pages/CategoriesPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { GoalsPage } from './pages/GoalsPage'
import { GoalHistoryPage } from './pages/GoalHistoryPage'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="board" element={<Board />} />
            <Route path="team" element={<Team />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="gestione_stato" element={<GestioneStato />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="goal-history" element={<GoalHistoryPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;