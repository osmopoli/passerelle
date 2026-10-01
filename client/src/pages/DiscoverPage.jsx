import Filters from '../components/Filters.jsx';
import ListingCard from '../components/ListingCard.jsx';
import { listListings } from '../api/listings.js';
import { isValidCategory, isValidType } from '../lib/constants.js';
import { navigate, useLocation } from '../lib/router.jsx';
import { useAsync } from '../lib/useAsync.js';

export default function DiscoverPage() {
  const { searchParams } = useLocation();
  // Les filtres vivent dans l'URL : partageables et conservés au retour du détail.
  const type = isValidType(searchParams.get('type')) ? searchParams.get('type') : '';
  const category = isValidCategory(searchParams.get('categorie')) ? searchParams.get('categorie') : '';
  const hasFilters = Boolean(type || category);

  const { status, data, error } = useAsync(
    (signal) => listListings({ type, category }, signal),
    [type, category],
  );

  function updateFilters(next) {
    const params = new URLSearchParams();
    if (next.type) params.set('type', next.type);
    if (next.category) params.set('categorie', next.category);
    const qs = params.toString();
    navigate(qs ? `/?${qs}` : '/', { replace: true });
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Découvrir les annonces</h1>
        <p className="mt-1 text-slate-600">
          Objets, services et coups de main proposés ou demandés près de chez vous.
        </p>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <Filters type={type} category={category} onChange={updateFilters} />
      </div>

      <section aria-labelledby="resultats" aria-busy={status === 'loading'}>
        <h2 id="resultats" className="sr-only">Résultats</h2>
        <p className="mb-4 text-sm text-slate-600" role="status" aria-live="polite">
          {status === 'loading' && 'Chargement des annonces…'}
          {status === 'success' &&
            `${data.length} annonce${data.length > 1 ? 's' : ''} trouvée${data.length > 1 ? 's' : ''}`}
        </p>

        {status === 'error' && (
          <div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-800 ring-1 ring-red-200">
            Impossible de charger les annonces. {error?.message}
          </div>
        )}

        {status === 'success' && data.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-4xl" aria-hidden="true">🔍</p>
            <h3 className="mt-3 text-lg font-semibold">Aucune annonce ne correspond</h3>
            <p className="mt-1 text-slate-600">
              {hasFilters
                ? 'Essayez un autre type ou une autre catégorie.'
                : "Il n'y a pas encore d'annonce disponible."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => updateFilters({ type: '', category: '' })}
                className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {status === 'success' && data.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
