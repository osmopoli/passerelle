import { useEffect, useRef, useState } from 'react';
import { StatusBadge, TypeBadge } from '../components/Badges.jsx';
import RequestPanel from '../components/RequestPanel.jsx';
import { NotFoundError, getListing } from '../api/listings.js';
import { categoryLabel, zoneLabel } from '../lib/constants.js';
import { Link, canGoBack } from '../lib/router.jsx';
import { useAsync } from '../lib/useAsync.js';
import NotFoundPage from './NotFoundPage.jsx';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function BackLink() {
  return (
    <Link
      to="/"
      onClick={(event) => {
        // Retour arrière pour conserver les filtres si l'on vient de la liste.
        if (canGoBack() && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          window.history.back();
        }
      }}
      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:underline"
    >
      <span aria-hidden="true">←</span> Retour aux annonces
    </Link>
  );
}

export default function ListingDetailPage({ id, user, onSessionExpired }) {
  const { status, data: loaded, error } = useAsync((signal) => getListing(id, signal), [id]);
  // Statut mis à jour localement après une demande (disponible → demandee).
  const [statusOverride, setStatusOverride] = useState(null);
  const listing = loaded && statusOverride ? { ...loaded, status: statusOverride } : loaded;
  const headingRef = useRef(null);

  useEffect(() => {
    if (status === 'success') headingRef.current?.focus();
  }, [status]);

  if (status === 'error' && error instanceof NotFoundError) {
    return <NotFoundPage message="Cette annonce n'existe pas ou a été retirée." />;
  }

  return (
    <>
      <BackLink />
      {status === 'loading' && (
        <p className="mt-6 text-slate-600" role="status">Chargement de l'annonce…</p>
      )}
      {status === 'error' && (
        <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-6 text-red-800 ring-1 ring-red-200">
          Impossible de charger l'annonce. {error?.message}
        </div>
      )}
      {status === 'success' && (
        <article className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={listing.type} />
              <StatusBadge status={listing.status} />
            </div>
            <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-2xl font-bold focus:outline-none sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-4 whitespace-pre-line text-slate-700">{listing.description}</p>
            <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Catégorie</dt>
                <dd className="font-medium">{categoryLabel(listing.category)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Disponibilité</dt>
                <dd className="font-medium">{listing.availability || 'Non précisée'}</dd>
              </div>
              {listing.createdAt && (
                <div>
                  <dt className="text-sm text-slate-500">Publiée le</dt>
                  <dd className="font-medium">
                    <time dateTime={listing.createdAt}>{dateFormat.format(new Date(listing.createdAt))}</time>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <aside aria-labelledby="auteur" className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 id="auteur" className="text-sm font-medium text-slate-500">Publiée par</h2>
            <p className="mt-1 text-lg font-semibold">{listing.author?.name ?? 'Habitant'}</p>
            {listing.author?.zone && (
              <p className="mt-1 text-slate-600">📍 {zoneLabel(listing.author.zone)}</p>
            )}
            <RequestPanel
              listing={listing}
              user={user}
              onSessionExpired={onSessionExpired}
              onRequested={() => listing.status === 'disponible' && setStatusOverride('demandee')}
            />
          </aside>
        </article>
      )}
    </>
  );
}
