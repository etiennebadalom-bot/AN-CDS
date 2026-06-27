import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employes from './pages/Employes';
import Presence from './pages/Presence';
import Paiement from './pages/Paiement';
import Collecteurs from './pages/Collecteurs';
import Depenses from './pages/Depenses';
import Rapports from './pages/Rapports';
import Parametres from './pages/Parametres';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employes" element={<Employes />} />
            <Route path="/presence" element={<Presence />} />
            <Route path="/paiement" element={<Paiement />} />
            <Route path="/collecteurs" element={<Collecteurs />} />
            <Route path="/depenses" element={<Depenses />} />
            <Route path="/rapports" element={<Rapports />} />
            <Route path="/parametres" element={<Parametres />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}
