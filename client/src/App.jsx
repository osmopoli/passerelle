import Layout from './components/Layout.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { useLocation } from './lib/router.jsx';

function Route() {
  const { pathname } = useLocation();
  if (pathname === '/') return <DiscoverPage />;
  const detail = pathname.match(/^\/annonces\/([^/]+)\/?$/);
  if (detail) {
    const id = decodeURIComponent(detail[1]);
    return <ListingDetailPage key={id} id={id} />;
  }
  return <NotFoundPage />;
}

export default function App() {
  return (
    <Layout>
      <Route />
    </Layout>
  );
}
