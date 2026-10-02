import { useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import ProfileScreen from './components/ProfileScreen.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import NewListingPage from './pages/NewListingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { api, getToken, setToken } from './api/client.js';
import { navigate, useLocation } from './lib/router.jsx';

function Route({ session }) {
  const { pathname } = useLocation();
  const { user, zones, setUser, logout, expire } = session;

  if (pathname === '/') return <DiscoverPage />;
  if (pathname === '/publier') return <NewListingPage user={user} />;
  if (pathname === '/tableau-de-bord') return <DashboardPage user={user} onSessionExpired={expire} />;
  const detail = pathname.match(/^\/annonces\/([^/]+)\/?$/);
  if (detail) {
    const id = decodeURIComponent(detail[1]);
    return <ListingDetailPage key={id} id={id} />;
  }
  if (pathname === '/connexion' || pathname === '/profil') {
    return (
      <div className="flex justify-center">
        {user ? (
          <ProfileScreen user={user} zones={zones} onUpdated={setUser} onLogout={logout} />
        ) : (
          <AuthScreen
            zones={zones}
            onAuthenticated={(u) => {
              setUser(u);
              navigate('/');
            }}
          />
        )}
      </div>
    );
  }
  return <NotFoundPage />;
}

export default function App() {
  const [zones, setZones] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    api('/meta')
      .then((data) => setZones(data.zones))
      .catch(() => setZones([]));

    if (!getToken()) return;
    // Token expiré ou révoqué : on l'oublie et on revient à l'état déconnecté.
    api('/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Token déjà invalide côté serveur : la déconnexion locale suffit.
    } finally {
      setToken(null);
      setUser(null);
      navigate('/');
    }
  }

  // Token refusé par l'API (401) pendant une action : déconnexion locale.
  function expire() {
    setToken(null);
    setUser(null);
  }

  return (
    <Layout user={user}>
      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : (
        <Route session={{ user, zones, setUser, logout, expire }} />
      )}
    </Layout>
  );
}
