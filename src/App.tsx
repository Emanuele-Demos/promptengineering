import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./store/AppContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { GuestRoute } from "./routes/GuestRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { Dashboard } from "./pages/Dashboard";
import { Board } from "./pages/Board";
import { Team } from "./pages/Team";
import { GestioneStato } from "./pages/GestioneStato";
import { GestioneCategorie } from "./pages/GestioneCategorie";
import { CentroNotifiche } from "./pages/CentroNotifiche";
import { GestioneObiettivi } from "./pages/GestioneObiettivi";
import { GestioneProgetti } from "./pages/GestioneProgetti";
import { DettaglioProgetto } from "./pages/DettaglioProgetto";
import { Archivio } from "./pages/Archivio";
import { CalendarPage } from "./pages/CalendarPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registrati" element={<RegisterPage />} />
            <Route path="/password-dimenticata" element={<ForgotPasswordPage />} />
            <Route path="/reimposta-password" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={
                <AppProvider>
                  <Layout />
                </AppProvider>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="board" element={<Board />} />
              <Route path="archivio" element={<Archivio />} />
              <Route path="calendario" element={<CalendarPage />} />
              <Route path="team" element={<Team />} />
              <Route path="gestione_stato" element={<GestioneStato />} />
              <Route path="gestione_categorie" element={<GestioneCategorie />} />
              <Route path="progetti" element={<GestioneProgetti />} />
              <Route path="progetti/:id" element={<DettaglioProgetto />} />
              <Route path="notifiche" element={<CentroNotifiche />} />
              <Route path="obiettivi" element={<GestioneObiettivi />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
