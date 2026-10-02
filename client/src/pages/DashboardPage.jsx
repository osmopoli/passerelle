import { useEffect, useRef, useState } from 'react';
import { RequestStatusBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx';
import {
  acceptRequest,
  closeListing,
  listMyListings,
  listMyRequests,
  refuseRequest,
} from '../api/dashboard.js';
import { zoneLabel } from '../lib/constants.js';
import { loginPath } from '../lib/redirect.js';
import { Link, navigate, useLocation } from '../lib/router.jsx';
import { useAsync } from '../lib/useAsync.js';

const PATH = '/tableau-de-bord';

const TABS = [
  { id: 'annonces', label: 'Mes annonces' },
  { id: 'demandes', label: 'Mes demandes' },
];

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '');

const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5';

const buttonBase =
  'rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const primaryButton = `${buttonBase} bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-600`;
const secondaryButton = `${buttonBase} bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:ring-emerald-600`;

function EmptyState({ children, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-slate-600">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function LoadingOrError({ state, label }) {
  if (state.status === 'error') {
    return (
      <div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-800 ring-1 ring-red-200">
        Impossible de charger {label}. {state.error?.message}
      </div>
    );
  }
  return (
    <p className="text-slate-600" role="status">
      Chargement de {label}…
    </p>
  );
}

function ReceivedRequest({ request, listing, busy, onAccept, onRefuse }) {
  const name = request.requester?.name || 'Un habitant';
  const canDecide = request.status === 'en_attente' && ['disponible', 'demandee'].includes(listing.status);
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{name}</p>
          <p className="text-sm text-slate-600">
            {request.requester?.zone && <>📍 {zoneLabel(request.requester.zone)}</>}
            {request.requester?.zone && request.createdAt && ' · '}
            {request.createdAt && <time dateTime={request.createdAt}>{formatDate(request.createdAt)}</time>}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      {request.message ? (
        <p className="mt-2 whitespace-pre-line break-words rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {request.message}
        </p>
      ) : (
        <p className="mt-2 text-sm italic text-slate-500">Pas de message.</p>
      )}
      {canDecide && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
          <button type="button" disabled={busy} onClick={() => onAccept(request)} className={primaryButton}>
            Accepter<span className="sr-only"> la demande de {name}</span>
          </button>
          <button type="button" disabled={busy} onClick={() => onRefuse(request)} className={secondaryButton}>
            Refuser<span className="sr-only"> la demande de {name}</span>
          </button>
        </div>
      )}
    </li>
  );
}

function MyListing({ listing, busyId, onAccept, onRefuse, onClose }) {
  const pending = listing.requests.filter((r) => r.status === 'en_attente').length;
  const headingId = `annonce-${listing.id}`;
  return (
    <li>
      <article aria-labelledby={headingId} className={card}>
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={listing.type} />
          <StatusBadge status={listing.status} />
        </div>
        <h3 id={headingId} className="mt-2 text-lg font-semibold leading-snug">
          <Link to={`/annonces/${encodeURIComponent(listing.id)}`} className="hover:text-emerald-800 hover:underline">
            {listing.title}
          </Link>
        </h3>

        {listing.status === 'acceptee' && (
          <div className="mt-3 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200">
            <p className="text-sm text-sky-900">
              L'échange est en cours. Une fois qu'il a eu lieu, marquez l'annonce comme terminée : elle
              disparaîtra de la découverte.
            </p>
            <button
              type="button"
              disabled={busyId === listing.id}
              onClick={() => onClose(listing)}
              className={`${primaryButton} mt-3 w-full sm:w-auto`}
            >
              {busyId === listing.id ? 'Enregistrement…' : 'Marquer comme terminé'}
              <span className="sr-only"> : {listing.title}</span>
            </button>
          </div>
        )}

        <section aria-label={`Demandes reçues pour « ${listing.title} »`} className="mt-4 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-700">
            Demandes reçues ({listing.requests.length})
            {pending > 0 && <span className="font-normal text-amber-800"> · {pending} en attente</span>}
          </h4>
          {listing.requests.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucune demande reçue pour le moment.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {listing.requests.map((request) => (
                <ReceivedRequest
                  key={request.id}
                  request={request}
                  listing={listing}
                  busy={Boolean(busyId)}
                  onAccept={onAccept}
                  onRefuse={onRefuse}
                />
              ))}
            </ul>
          )}
        </section>
      </article>
    </li>
  );
}

function SentRequest({ request }) {
  const { listing } = request;
  return (
    <li className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">
            <Link to={`/annonces/${encodeURIComponent(listing.id)}`} className="hover:text-emerald-800 hover:underline">
              {listing.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">
            {listing.author?.name ?? 'Habitant'}
            {listing.author?.zone && <> · 📍 {zoneLabel(listing.author.zone)}</>}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      {request.message && (
        <p className="mt-2 whitespace-pre-line break-words rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <span className="sr-only">Votre message : </span>
          {request.message}
        </p>
      )}
      {request.status === 'acceptee' && (
        <p className="mt-2 text-sm text-emerald-800">
          Demande acceptée : organisez l'échange avec {listing.author?.name ?? "l'auteur"}.
        </p>
      )}
      {request.createdAt && (
        <p className="mt-2 text-xs text-slate-500">
          Envoyée le <time dateTime={request.createdAt}>{formatDate(request.createdAt)}</time>
        </p>
      )}
    </li>
  );
}

function MyListingsTab({ user, version, busyId, onAccept, onRefuse, onClose }) {
  const state = useAsync((signal) => listMyListings(user.id, signal), [user.id, version]);
  if (!state.data) return <LoadingOrError state={state} label="vos annonces" />;
  if (state.data.length === 0) {
    return (
      <EmptyState
        action={
          <Link to="/publier" className={primaryButton}>
            Publier une annonce
          </Link>
        }
      >
        Vous n'avez pas encore publié d'annonce.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-4">
      {state.data.map((listing) => (
        <MyListing
          key={listing.id}
          listing={listing}
          busyId={busyId}
          onAccept={onAccept}
          onRefuse={onRefuse}
          onClose={onClose}
        />
      ))}
    </ul>
  );
}

function MyRequestsTab({ user, version }) {
  const state = useAsync((signal) => listMyRequests(user.id, signal), [user.id, version]);
  if (!state.data) return <LoadingOrError state={state} label="vos demandes" />;
  if (state.data.length === 0) {
    return (
      <EmptyState
        action={
          <Link to="/" className={primaryButton}>
            Découvrir les annonces
          </Link>
        }
      >
        Vous n'avez envoyé aucune demande.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-4">
      {state.data.map((request) => (
        <SentRequest key={request.id} request={request} />
      ))}
    </ul>
  );
}

function Tabs({ current }) {
  const refs = useRef({});

  function select(id) {
    navigate(id === 'annonces' ? PATH : `${PATH}?onglet=${id}`, { replace: true });
    refs.current[id]?.focus();
  }

  function handleKeyDown(event) {
    const index = TABS.findIndex((t) => t.id === current);
    const moves = { ArrowRight: 1, ArrowLeft: -1 };
    if (event.key in moves) {
      event.preventDefault();
      select(TABS[(index + moves[event.key] + TABS.length) % TABS.length].id);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      select(TABS[event.key === 'Home' ? 0 : TABS.length - 1].id);
    }
  }

  return (
    <div role="tablist" aria-label="Tableau de bord" onKeyDown={handleKeyDown} className="flex gap-1 rounded-2xl bg-slate-200/70 p-1">
      {TABS.map((tab) => {
        const selected = tab.id === current;
        return (
          <button
            key={tab.id}
            ref={(el) => (refs.current[tab.id] = el)}
            type="button"
            role="tab"
            id={`onglet-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panneau-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => select(tab.id)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:flex-none sm:px-5 ${
              selected ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// `user` vient de la session de l'application (App.jsx, GET /api/me).
export default function DashboardPage({ user, onSessionExpired }) {
  const { searchParams } = useLocation();
  const tab = searchParams.get('onglet') === 'demandes' ? 'demandes' : 'annonces';
  // Incrémenté après chaque action pour recharger la liste depuis la source.
  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const feedbackRef = useRef(null);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold sm:text-3xl">Mon tableau de bord</h1>
        <EmptyState
          action={
            <Link to={loginPath(PATH)} className={primaryButton}>
              Se connecter
            </Link>
          }
        >
          Connectez-vous pour suivre vos annonces et vos demandes.
        </EmptyState>
      </div>
    );
  }

  async function run(id, action, success) {
    setBusyId(id);
    setFeedback(null);
    try {
      await action();
      setFeedback({ type: 'success', text: success, tab });
    } catch (err) {
      if (err.status === 401) {
        onSessionExpired?.();
        navigate(loginPath(PATH));
        return;
      }
      setFeedback({ type: 'error', text: err.message, tab });
    } finally {
      setBusyId(null);
      setVersion((v) => v + 1);
    }
  }

  const name = (request) => request.requester?.name || 'cet habitant';

  const handleAccept = (request) =>
    run(
      request.id,
      () => acceptRequest(request.id),
      `Demande de ${name(request)} acceptée. Les autres demandes en attente sur cette annonce ont été refusées.`,
    );
  const handleRefuse = (request) =>
    run(request.id, () => refuseRequest(request.id), `Demande de ${name(request)} refusée.`);
  const handleClose = (listing) =>
    run(listing.id, () => closeListing(listing.id), `« ${listing.title} » est marquée comme terminée.`);

  return (
    <>
      <h1 className="text-2xl font-bold sm:text-3xl">Mon tableau de bord</h1>
      <p className="mt-1 text-slate-600">Suivez vos annonces, les demandes reçues et celles que vous avez envoyées.</p>

      <div className="mt-5">
        <Tabs current={tab} />
      </div>

      {/* Le message ne concerne que l'onglet où l'action a eu lieu. */}
      {feedback?.tab === tab && (
        <p
          ref={feedbackRef}
          tabIndex={-1}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-xl p-3 text-sm font-medium ring-1 focus:outline-none ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-800 ring-red-200'
              : 'bg-emerald-50 text-emerald-900 ring-emerald-200'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div id={`panneau-${tab}`} role="tabpanel" aria-labelledby={`onglet-${tab}`} className="mt-5">
        {tab === 'annonces' ? (
          <MyListingsTab
            user={user}
            version={version}
            busyId={busyId}
            onAccept={handleAccept}
            onRefuse={handleRefuse}
            onClose={handleClose}
          />
        ) : (
          <MyRequestsTab user={user} version={version} />
        )}
      </div>
    </>
  );
}
