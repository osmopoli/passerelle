import { Link } from '../lib/router.jsx';
import { categoryLabel, zoneLabel } from '../lib/constants.js';
import { StatusBadge, TypeBadge } from './Badges.jsx';

export default function ListingCard({ listing }) {
  // Une annonce déjà demandée ou acceptée reste visible mais passe au second
  // plan : panneau partagé, mais fond brume et sans chant d'enseigne.
  const available = listing.status === 'disponible';

  return (
    <article
      className={`panel relative flex h-full flex-col px-4 pb-4 ${
        available ? '' : 'bg-mist shadow-none'
      } focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-lagoon`}
    >
      {/* Étiquette cousue en haut de la carte. */}
      <TypeBadge type={listing.type} attached as="p" />
      <h3 className="mt-3 text-lg font-bold leading-snug">
        {/* Le lien s'étend à toute la carte via ::after. */}
        <Link
          to={`/annonces/${encodeURIComponent(listing.id)}`}
          className="after:absolute after:inset-0 after:rounded-card focus:outline-none"
        >
          {listing.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-ink-muted">{listing.description}</p>
      <dl className="mt-auto grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 pt-4 text-sm">
        <div>
          <dt className="sr-only">Catégorie</dt>
          <dd>{categoryLabel(listing.category)}</dd>
        </div>
        <div className="row-span-2 self-end text-right">
          <dt className="sr-only">Statut</dt>
          <dd>
            <StatusBadge status={listing.status} labelled={false} />
          </dd>
        </div>
        {listing.author?.zone && (
          <div>
            <dt className="sr-only">Zone</dt>
            <dd className="text-ink-muted">{zoneLabel(listing.author.zone)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
