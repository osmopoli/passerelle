import { requestStatusLabel, statusLabel, typeLabel } from '../lib/constants.js';

// Type d'annonce : une enseigne pleine. Safran pour une offre, salouva pour une
// demande, sur tous les écrans : la couleur porte l'information.
const TYPE_STYLES = {
  offre: 'bg-saffron text-ink',
  demande: 'bg-salouva text-white',
};

// Statuts : une pilule à contour, pour ne jamais se confondre avec l'enseigne
// de type. Une seule échelle partagée par les annonces et les demandes.
const TONES = {
  open: 'border-lagoon bg-white text-lagoon',
  pending: 'border-dashed border-ink bg-mist text-ink',
  accepted: 'border-lagoon bg-lagoon text-white',
  closed: 'border-ink-muted bg-mist text-ink-muted',
  refused: 'border-danger bg-danger-wash text-danger',
};

const STATUS_TONES = {
  disponible: TONES.open,
  demandee: TONES.pending,
  acceptee: TONES.accepted,
  terminee: TONES.closed,
};

const REQUEST_STATUS_TONES = {
  en_attente: TONES.pending,
  acceptee: TONES.accepted,
  refusee: TONES.refused,
};

const pill = 'inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-sm font-bold leading-tight';

/**
 * `attached` : l'étiquette est cousue au bord haut d'un panneau (carte de
 * Découverte) ; seuls les coins du bas sont arrondis. Couleurs, police et
 * gabarit restent identiques.
 */
export function TypeBadge({ type, attached = false, as: Tag = 'span' }) {
  return (
    <Tag
      className={`inline-flex items-center self-start px-3 py-1 text-sm font-bold leading-tight ${
        attached ? 'rounded-b-control' : 'rounded-control'
      } ${TYPE_STYLES[type] ?? 'bg-ink text-white'}`}
    >
      {typeLabel(type)}
    </Tag>
  );
}

/** `labelled` : préfixe « Statut : » pour les lecteurs d'écran, inutile si un `<dt>` le dit déjà. */
export function StatusBadge({ status, labelled = true }) {
  return (
    <span className={`${pill} ${STATUS_TONES[status] ?? TONES.closed}`}>
      {labelled && <span className="sr-only">Statut : </span>}
      {statusLabel(status)}
    </span>
  );
}

export function RequestStatusBadge({ status }) {
  return (
    <span className={`${pill} ${REQUEST_STATUS_TONES[status] ?? TONES.pending}`}>
      <span className="sr-only">Statut de la demande : </span>
      {requestStatusLabel(status)}
    </span>
  );
}
