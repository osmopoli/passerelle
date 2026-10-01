import { Link } from '../lib/router.jsx';
import { categoryLabel, zoneLabel } from '../lib/constants.js';
import { StatusBadge, TypeBadge } from './Badges.jsx';

export default function ListingCard({ listing }) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-emerald-600/40 focus-within:ring-2 focus-within:ring-emerald-600">
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={listing.type} />
        <StatusBadge status={listing.status} />
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900">
        {/* Le lien s'étend à toute la carte via ::after. */}
        <Link
          to={`/annonces/${encodeURIComponent(listing.id)}`}
          className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none"
        >
          {listing.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{listing.description}</p>
      <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-sm text-slate-600">
        <div className="flex gap-1">
          <dt className="sr-only">Catégorie</dt>
          <dd>{categoryLabel(listing.category)}</dd>
        </div>
        {listing.author?.zone && (
          <div className="flex gap-1">
            <dt className="sr-only">Zone</dt>
            <dd>📍 {zoneLabel(listing.author.zone)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
