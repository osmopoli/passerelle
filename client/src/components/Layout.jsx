import { Link, useLocation } from '../lib/router.jsx';
import { LISTINGS_SOURCE } from '../api/listings.js';

export default function Layout({ user, children }) {
  const { pathname } = useLocation();
  const linkClass = 'font-bold text-ink underline-offset-4 hover:underline';
  return (
    <div className="min-h-screen bg-white font-sans text-ink">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-control focus:bg-white focus:px-4 focus:py-2"
      >
        Aller au contenu
      </a>
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-2 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="font-display text-xl leading-none text-ink sm:text-2xl">
            passerelle
          </Link>
          <nav aria-label="Navigation principale" className="ml-auto flex flex-wrap items-center gap-3 sm:gap-4">
            <Link to="/" className={`hidden sm:inline ${linkClass}`}>
              Découvrir
            </Link>
            <Link to="/publier" className={linkClass}>
              Publier
            </Link>
            {user && (
              <Link
                to="/tableau-de-bord"
                aria-current={pathname === '/tableau-de-bord' ? 'page' : undefined}
                className={`${linkClass} whitespace-nowrap aria-[current=page]:underline`}
              >
                <span className="sm:hidden">Mon espace</span>
                <span className="hidden sm:inline">Tableau de bord</span>
              </Link>
            )}
            <Link
              to={user ? '/profil' : '/connexion'}
              className="rounded-control bg-lagoon px-3 py-1.5 font-bold text-white hover:bg-ink"
            >
              {user ? 'Mon profil' : 'Se connecter'}
            </Link>
          </nav>
        </div>
        {LISTINGS_SOURCE === 'mock' && (
          <p className="bg-mist px-4 py-1.5 text-center text-sm text-ink">
            Données fictives : l'API annonces n'est pas encore branchée.
          </p>
        )}
      </header>
      <main id="contenu" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
