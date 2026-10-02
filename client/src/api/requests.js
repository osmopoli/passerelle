import { api } from './client.js';
import { LISTINGS_SOURCE, markMockListingRequested } from './listings.js';

// Adaptateur demandes d'échange. Contrat de l'API (PAND-11, PR #8) :
//   POST /api/listings/:id/requests { message? } (Bearer, message ≤ 1000)
//     renvoie 201 ExchangeRequest
//     renvoie 401 non connecté, 403 { error } sa propre annonce,
//       409 { error } annonce acceptée/terminée ou déjà demandée, 404, 422 validation
// Les erreurs portent `status` et le message de l'API (voir api/client.js).
export const MESSAGE_MAX = 1000;

const FALLBACK_MESSAGES = {
  403: 'Vous ne pouvez pas demander votre propre annonce.',
  404: "Cette annonce n'existe plus.",
  409: "Cette annonce n'accepte plus de demandes, ou vous l'avez déjà demandée.",
};

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// L'API ne dit pas encore si l'utilisateur a déjà demandé une annonce : on
// garde trace des demandes envoyées depuis ce navigateur pour afficher
// « Demande envoyée » après un rechargement.
const SENT_KEY = 'passerelle:sent-requests';

function readSent() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY)) ?? [];
  } catch {
    return [];
  }
}

const sentKey = (userId, listingId) => `${userId}:${listingId}`;

export const hasSentRequest = (userId, listingId) => readSent().includes(sentKey(userId, listingId));

function rememberSent(userId, listingId) {
  const sent = readSent();
  const key = sentKey(userId, listingId);
  if (!sent.includes(key)) localStorage.setItem(SENT_KEY, JSON.stringify([...sent, key]));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Demandes « côté serveur » du mode fictif, distinctes du cache ci-dessus.
const MOCK_REQUESTS_KEY = 'passerelle:mock-requests';

function readMockRequests() {
  try {
    return JSON.parse(sessionStorage.getItem(MOCK_REQUESTS_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function sendMock(listing, user, message) {
  await delay(250);
  if (listing.authorId === user.id) throw requestError(403, FALLBACK_MESSAGES[403]);
  if (listing.status === 'acceptee' || listing.status === 'terminee') {
    throw requestError(409, "Cette annonce n'accepte plus de demandes");
  }
  const requests = readMockRequests();
  const key = sentKey(user.id, listing.id);
  if (requests.includes(key)) throw requestError(409, 'Vous avez déjà demandé cette annonce');
  sessionStorage.setItem(MOCK_REQUESTS_KEY, JSON.stringify([...requests, key]));
  markMockListingRequested(listing.id);
  return { listingId: listing.id, message, status: 'en_attente' };
}

async function sendApi(listing, message) {
  try {
    return await api(`/listings/${encodeURIComponent(listing.id)}/requests`, {
      method: 'POST',
      body: message ? { message } : {},
    });
  } catch (error) {
    // Message générique du client HTTP : on le remplace par un message utile.
    if (error.message === 'Une erreur est survenue.' && FALLBACK_MESSAGES[error.status]) {
      error.message = FALLBACK_MESSAGES[error.status];
    }
    throw error;
  }
}

export async function sendRequest(listing, user, message) {
  const text = message.trim();
  const created =
    LISTINGS_SOURCE === 'api' ? await sendApi(listing, text) : await sendMock(listing, user, text);
  rememberSent(user.id, listing.id);
  return created;
}
