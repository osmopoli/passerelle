import { requestStatusLabel, statusLabel, typeLabel } from '../lib/constants.js';

const STATUS_STYLES = {
  disponible: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  demandee: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  acceptee: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  terminee: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

const REQUEST_STATUS_STYLES = {
  en_attente: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  acceptee: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  refusee: 'bg-red-50 text-red-800 ring-red-600/20',
};

const TYPE_STYLES = {
  offre: 'bg-emerald-700 text-white',
  demande: 'bg-violet-700 text-white',
};

export function TypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_STYLES[type] ?? 'bg-slate-700 text-white'}`}>
      {typeLabel(type)}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] ?? STATUS_STYLES.terminee}`}>
      <span className="sr-only">Statut : </span>
      {statusLabel(status)}
    </span>
  );
}

export function RequestStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${REQUEST_STATUS_STYLES[status] ?? REQUEST_STATUS_STYLES.en_attente}`}>
      <span className="sr-only">Statut de la demande : </span>
      {requestStatusLabel(status)}
    </span>
  );
}
