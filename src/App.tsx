import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./store/AppContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Board } from "./pages/Board";
import { Team } from "./pages/Team";
import { GestioneStato } from "./pages/GestioneStato";
import { GestioneCategorie } from "./pages/GestioneCategorie";
import { CentroNotifiche } from "./pages/CentroNotifiche";
import { GestioneObiettivi } from "./pages/GestioneObiettivi";
import { GestioneProgetti } from "./pages/GestioneProgetti";
import { DettaglioProgetto } from "./pages/DettaglioProgetto";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="board" element={<Board />} />
            <Route path="team" element={<Team />} />
            <Route path="gestione_stato" element={<GestioneStato />} />
            <Route path="gestione_categorie" element={<GestioneCategorie />} />
            <Route path="progetti" element={<GestioneProgetti />} />
            <Route path="progetti/:id" element={<DettaglioProgetto />} />
            <Route path="notifiche" element={<CentroNotifiche />} />
            <Route path="obiettivi" element={<GestioneObiettivi />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}