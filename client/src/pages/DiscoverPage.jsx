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
      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-4xl leading-tight sm:text-6xl">Ce qui s'échange près de chez vous</h1>
        <p className="mt-3 text-lg text-ink-muted">
          Un objet à prêter, un coup de main à donner, un service à trouver entre voisins.
        </p>
      </div>

      <div className="mb-6">
        <Filters type={type} category={category} onChange={updateFilters} />
      </div>

      <section aria-labelledby="resultats" aria-busy={status === 'loading'}>
        <h2 id="resultats" className="sr-only">Résultats</h2>
        <p className="mb-4 font-bold" role="status" aria-live="polite">
          {status === 'loading' && 'Chargement des annonces...'}
          {status === 'success' &&
            `${data.length} annonce${data.length > 1 ? 's' : ''} trouvée${data.length > 1 ? 's' : ''}`}
        </p>

        {status === 'error' && (
          <div role="alert" className="rounded-card border-2 border-salouva p-6 text-salouva">
            Impossible de charger les annonces. {error?.message}
          </div>
        )}

        {status === 'success' && data.length === 0 && (
          <div className="rounded-card bg-mist px-6 py-12 text-center">
            <h3 className="text-lg font-bold">Aucune annonce ne correspond</h3>
            <p className="mt-1 text-ink-muted">
              {hasFilters
                ? 'Essayez un autre type ou une autre catégorie.'
                : "Il n'y a pas encore d'annonce disponible."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => updateFilters({ type: '', category: '' })}
                className="mt-5 rounded-control bg-lagoon px-5 py-2.5 font-bold text-white hover:bg-ink"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {status === 'success' && data.length > 0 && (
          <ul className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
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
