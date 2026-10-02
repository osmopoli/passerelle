import { useEffect, useId, useRef, useState } from 'react';
import { MESSAGE_MAX, hasSentRequest, sendRequest } from '../api/requests.js';
import { loginPath } from '../lib/redirect.js';
import { navigate } from '../lib/router.jsx';

const REQUESTABLE = ['disponible', 'demandee'];

// Bouton principal partagé (index.css) ; le reste du panneau suit dans PAND-24.
const primaryButton = 'btn-primary w-full';

// `user` vient de la session de l'application (App.jsx, GET /api/me) ;
// `onSessionExpired` oublie le token quand l'API répond 401.
export default function RequestPanel({ listing, user, onRequested, onSessionExpired }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [justSent, setJustSent] = useState(false);
  const messageRef = useRef(null);
  const confirmationRef = useRef(null);
  const ids = useId();

  const sent = justSent || (user ? hasSentRequest(String(user.id), listing.id) : false);

  useEffect(() => {
    if (open) messageRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (justSent) confirmationRef.current?.focus();
  }, [justSent]);

  if (!REQUESTABLE.includes(listing.status)) return null;
  if (user && String(user.id) === listing.authorId) {
    return <p className="mt-6 text-sm text-slate-600">C'est votre annonce.</p>;
  }

  function goToLogin() {
    navigate(loginPath(`/annonces/${encodeURIComponent(listing.id)}`));
  }

  function handleAsk() {
    if (!user) return goToLogin();
    setError('');
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (message.length > MESSAGE_MAX) {
      setError(`Le message ne doit pas dépasser ${MESSAGE_MAX} caractères.`);
      return;
    }
    setSending(true);
    setError('');
    try {
      await sendRequest(listing, { ...user, id: String(user.id) }, message);
      setJustSent(true);
      setOpen(false);
      onRequested?.();
    } catch (err) {
      if (err.status === 401) {
        onSessionExpired?.();
        return goToLogin();
      }
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6">
        {justSent && (
          <p
            ref={confirmationRef}
            tabIndex={-1}
            role="status"
            className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200 focus:outline-none"
          >
            Votre demande a bien été envoyée. L'auteur de l'annonce va l'accepter ou la refuser.
          </p>
        )}
        <button type="button" disabled className={primaryButton}>
          Demande envoyée
        </button>
      </div>
    );
  }

  const messageId = `${ids}-message`;
  const counterId = `${ids}-counter`;
  const errorId = `${ids}-error`;
  const tooLong = message.length > MESSAGE_MAX;

  return (
    <div className="mt-6">
      {!open ? (
        <>
          <button type="button" onClick={handleAsk} className={primaryButton}>
            Demander
          </button>
          {!user && (
            <p className="mt-2 text-center text-xs text-slate-500">
              Vous serez invité à vous connecter.
            </p>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor={messageId} className="block font-medium">
            Message à l'auteur <span className="font-normal text-slate-500">(facultatif)</span>
          </label>
          <textarea
            id={messageId}
            ref={messageRef}
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-describedby={`${counterId}${error ? ` ${errorId}` : ''}`}
            aria-invalid={tooLong || undefined}
            placeholder="Bonjour, votre annonce m'intéresse. Je peux passer samedi matin."
            className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 ${
              tooLong
                ? 'border-red-500 focus:ring-red-600/30'
                : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/40'
            }`}
          />
          <p id={counterId} className={`mt-1 text-right text-xs ${tooLong ? 'text-red-700' : 'text-slate-500'}`}>
            {message.length} / {MESSAGE_MAX}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button type="submit" disabled={sending} className={primaryButton}>
              {sending ? 'Envoi...' : 'Envoyer la demande'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError('');
              }}
              className="w-full rounded-xl px-4 py-2.5 font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
