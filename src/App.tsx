import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from "./store/AppContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Board } from "./pages/Board";
import { Team } from "./pages/Team";

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <BrowserRouter>
      <AppProvider>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Layout currentView={currentView} onViewChange={setCurrentView} />
          
          <main style={{ flex: 1, padding: '20px', backgroundColor: '#f8fafc' }}>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'board' && <Board />}
            {currentView === 'team' && <Team />}
          </main>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;