import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Board } from './pages/Board'
import { Team } from './pages/Team'
import { CalendarPage } from './pages/CalendarPage'
import { GestioneStato } from './pages/GestioneStato'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="board" element={<Board />} />
            <Route path="team" element={<Team />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="gestione_stato" element={<GestioneStato />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
