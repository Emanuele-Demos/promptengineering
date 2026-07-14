import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Board } from './pages/Board'
import { Team } from './pages/Team'
import { CalendarPage } from './pages/CalendarPage'
import { GestioneStato } from './pages/GestioneStato'
import { Categories } from './pages/Categories'

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="board" element={<Board />} />
            <Route path="team" element={<Team />} />
            <Route path="categories" element={<Categories />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="gestione_stato" element={<GestioneStato />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
