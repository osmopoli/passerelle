import { LISTINGS_SOURCE, allMockListings, normalizeListing, setMockListingStatus } from './listings.js';
import { MOCK_USERS } from './mockListings.js';
import { getToken } from './client.js';
import { normalizeKey } from '../lib/constants.js';

// Adaptateur tableau de bord. Contrats de l'API :
//   GET  /api/me/listings  (PAND-14, PR #12) → Listing[] avec `requests` (ou `exchangeRequests`) :
//        [{ id, message, status, createdAt, requester: { id, fullName, zone } }]
//   GET  /api/me/requests  (PAND-14, PR #12) → ExchangeRequest[] avec `listing.author`
//   POST /api/requests/:id/accept  (PAND-12, PR #10) → 200 ExchangeRequest + `listing`
//   POST /api/requests/:id/refuse  (PAND-12, PR #10) → 200 ExchangeRequest + `listing`
//   POST /api/listings/:id/close   (PAND-13, PR #11) → 200 Listing
// Erreurs : 401 non connecté, 403 { error } pas l'auteur, 404, 409 { error } déjà traitée.

const API = `${import.meta.env.BASE_URL}api`;

const FALLBACK_MESSAGES = {
  401: 'Votre session a expiré. Connectez-vous de nouveau.',
  403: "Seul l'auteur de l'annonce peut faire cette action.",
  404: "Cette demande ou cette annonce n'existe plus.",
  409: 'Cette action a déjà été faite. La liste a été mise à jour.',
};

function normalizeRequest(raw) {
  const requester = raw.requester
    ? {
        ...raw.requester,
        id: String(raw.requester.id),
        name: raw.requester.name ?? raw.requester.fullName ?? raw.requester.full_name ?? '',
        zone: normalizeKey(raw.requester.zone),
      }
    : null;
  return {
    ...raw,
    id: String(raw.id),
    status: normalizeKey(raw.status),
    message: raw.message ?? '',
    requester,
    listing: raw.listing ? normalizeListing(raw.listing) : null,
  };
}

// Erreur portant le statut HTTP, comme celles de `api()` (api/client.js).
class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const byNewest = (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));

// ---------------------------------------------------------------------------
// Mode fictif : demandes reçues et envoyées par le compte fictif (`moi`),
// conservées pour la session de l'onglet. Le compte connecté (GET /api/me)
// joue le rôle de `moi` : les annonces fictives lui sont attribuées.
const MOCK_OWNER_ID = 'moi';

const MOCK_STATE_KEY = 'passerelle:mock-dashboard';

const MOCK_SEED = {
  received: [
    {
      id: 'r1',
      listingId: 'd1',
      requester: MOCK_USERS.karim,
      message: 'Bonjour, je peux passer la chercher jeudi soir et la rapporter samedi.',
      status: 'en_attente',
      createdAt: '2026-10-01T08:20:00Z',
    },
    {
      id: 'r2',
      listingId: 'd1',
      requester: MOCK_USERS.lea,
      message: '',
      status: 'en_attente',
      createdAt: '2026-09-30T19:05:00Z',
    },
    {
      id: 'r3',
      listingId: 'd2',
      requester: MOCK_USERS.alice,
      message: 'Parfait pour mon déménagement, merci !',
      status: 'acceptee',
      createdAt: '2026-09-25T09:00:00Z',
    },
    {
      id: 'r4',
      listingId: 'd2',
      requester: MOCK_USERS.karim,
      message: 'Je suis intéressé aussi si ça ne se fait pas.',
      status: 'refusee',
      createdAt: '2026-09-25T07:30:00Z',
    },
  ],
  sent: [
    { id: 's1', listingId: 'l3', message: 'Pour ma fille en 4e.', status: 'en_attente', createdAt: '2026-09-29T15:00:00Z' },
    { id: 's2', listingId: 'l4', message: '', status: 'acceptee', createdAt: '2026-09-21T10:00:00Z' },
    { id: 's3', listingId: 'l6', message: 'Une place pour samedi ?', status: 'refusee', createdAt: '2026-09-28T06:45:00Z' },
  ],
};

function readMockState() {
  try {
    return JSON.parse(sessionStorage.getItem(MOCK_STATE_KEY)) ?? MOCK_SEED;
  } catch {
    return MOCK_SEED;
  }
}

const writeMockState = (state) => sessionStorage.setItem(MOCK_STATE_KEY, JSON.stringify(state));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockSource = {
  async myListings() {
    await delay(150);
    const { received } = readMockState();
    return allMockListings()
      .filter((l) => l.author?.id === MOCK_OWNER_ID)
      .map((l) => ({ ...l, requests: received.filter((r) => r.listingId === l.id) }));
  },
  async myRequests() {
    await delay(150);
    const listings = allMockListings();
    const { sent } = readMockState();
    return sent
      .map((r) => ({ ...r, listing: listings.find((l) => l.id === r.listingId) }))
      .filter((r) => r.listing);
  },
  async decide(requestId, decision) {
    await delay(200);
    const state = readMockState();
    const request = state.received.find((r) => r.id === requestId);
    if (!request) throw new RequestError(404, FALLBACK_MESSAGES[404]);
    if (request.status !== 'en_attente') throw new RequestError(409, 'Cette demande a déjà été traitée');
    const received = state.received.map((r) => {
      if (r.id === requestId) return { ...r, status: decision };
      // Accepter une demande refuse les autres demandes en attente de l'annonce.
      if (decision === 'acceptee' && r.listingId === request.listingId && r.status === 'en_attente') {
        return { ...r, status: 'refusee' };
      }
      return r;
    });
    writeMockState({ ...state, received });
    const listing = allMockListings().find((l) => l.id === request.listingId);
    if (decision === 'acceptee') {
      setMockListingStatus(listing.id, 'acceptee');
    } else if (
      listing.status === 'demandee' &&
      !received.some((r) => r.listingId === listing.id && r.status === 'en_attente')
    ) {
      setMockListingStatus(listing.id, 'disponible');
    }
    return { ...request, status: decision };
  },
  async close(listingId) {
    await delay(200);
    const listing = allMockListings().find((l) => l.id === listingId);
    if (!listing) throw new RequestError(404, FALLBACK_MESSAGES[404]);
    if (listing.status !== 'acceptee') {
      throw new RequestError(409, "Seule une annonce acceptée peut être marquée comme terminée");
    }
    setMockListingStatus(listingId, 'terminee');
    return { ...listing, status: 'terminee' };
  },
};

// ---------------------------------------------------------------------------
// Mode API

async function callApi(path, { method = 'GET', signal } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    signal,
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new RequestError(
      res.status,
      data?.error ?? data?.errors?.[0]?.message ?? FALLBACK_MESSAGES[res.status] ?? `Erreur API (${res.status})`,
    );
  }
  return data;
}

const asArray = (data, key) => (Array.isArray(data) ? data : (data?.[key] ?? data?.data ?? []));

const apiSource = {
  async myListings(_userId, signal) {
    return asArray(await callApi('/me/listings', { signal }), 'listings').map((l) => ({
      ...l,
      requests: l.requests ?? l.exchangeRequests ?? [],
    }));
  },
  async myRequests(_userId, signal) {
    return asArray(await callApi('/me/requests', { signal }), 'requests');
  },
  decide(requestId, decision) {
    const action = decision === 'acceptee' ? 'accept' : 'refuse';
    return callApi(`/requests/${encodeURIComponent(requestId)}/${action}`, { method: 'POST' });
  },
  close(listingId) {
    return callApi(`/listings/${encodeURIComponent(listingId)}/close`, { method: 'POST' });
  },
};

const source = LISTINGS_SOURCE === 'api' ? apiSource : mockSource;

export async function listMyListings(userId, signal) {
  const listings = await source.myListings(userId, signal);
  return listings
    .map((l) => ({ ...normalizeListing(l), requests: l.requests.map(normalizeRequest).sort(byNewest) }))
    .sort(byNewest);
}

export async function listMyRequests(userId, signal) {
  return (await source.myRequests(userId, signal)).map(normalizeRequest).sort(byNewest);
}

export const acceptRequest = (requestId) => source.decide(requestId, 'acceptee');
export const refuseRequest = (requestId) => source.decide(requestId, 'refusee');
export const closeListing = (listingId) => source.close(listingId);
