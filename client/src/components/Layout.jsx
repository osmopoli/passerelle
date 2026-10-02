import { Link } from '../lib/router.jsx';
import { LISTINGS_SOURCE } from '../api/listings.js';

export default function Layout({ user, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Aller au contenu
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-emerald-700">
            PASSERELLE
          </Link>
          <nav aria-label="Navigation principale" className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-slate-700 hover:text-emerald-700">
              Découvrir
            </Link>
            <Link
              to={user ? '/profil' : '/connexion'}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {user ? 'Mon profil' : 'Se connecter'}
            </Link>
          </nav>
        </div>
        {LISTINGS_SOURCE === 'mock' && (
          <p className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
            Données fictives — l'API annonces n'est pas encore branchée.
          </p>
        )}
      </header>
      <main id="contenu" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
