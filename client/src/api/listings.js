import { MOCK_LISTINGS } from './mockListings.js';
import { createMockListing, readCreated } from './mockCreated.js';
import { api } from './client.js';
import { normalizeKey } from '../lib/constants.js';

// Adaptateur annonces. Par défaut il sert les données fictives ; avec
// VITE_LISTINGS_SOURCE=api il interroge l'API AdonisJS (contrat proposé dans
// PAND-8, à confirmer par PAND-7) :
//   GET /api/listings?type=&category=  → Listing[] (ou { listings: Listing[] })
//   GET /api/listings/:id              → Listing (ou { listing: Listing }), 404 sinon
//   POST /api/listings (Bearer)        → 201 Listing ; 400 { errors: [{ field, message }] } ; 401
export const LISTINGS_SOURCE = import.meta.env.VITE_LISTINGS_SOURCE === 'api' ? 'api' : 'mock';

const API = `${import.meta.env.BASE_URL}api`;

export class NotFoundError extends Error {}

export function normalizeListing(raw) {
  // L'auteur peut être préchargé sous `author` ou `user` selon la route.
  const rawAuthor = raw.author ?? raw.user;
  return {
    ...raw,
    id: String(raw.id),
    type: normalizeKey(raw.type),
    category: normalizeKey(raw.category),
    status: normalizeKey(raw.status),
    author: rawAuthor
      ? {
          ...rawAuthor,
          name: rawAuthor.name ?? rawAuthor.fullName ?? rawAuthor.full_name,
          zone: normalizeKey(rawAuthor.zone),
        }
      : null,
  };
}

function byNewest(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Statuts imposés par une décision fictive du tableau de bord (voir dashboard.js) :
// acceptation, refus de la dernière demande ou clôture.
const MOCK_STATUS_KEY = 'passerelle:mock-listing-statuses';

function readStatuses() {
  try {
    return JSON.parse(sessionStorage.getItem(MOCK_STATUS_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function setMockListingStatus(id, status) {
  sessionStorage.setItem(MOCK_STATUS_KEY, JSON.stringify({ ...readStatuses(), [id]: status }));
}

// Annonces fictives de départ et publiées dans l'onglet (PAND-9), avec leur statut courant.
export const allMockListings = () => {
  const statuses = readStatuses();
  return [...readCreated(), ...MOCK_LISTINGS].map((l) =>
    statuses[l.id] ? { ...l, status: statuses[l.id] } : l,
  );
};

const mockSource = {
  async list({ type, category } = {}) {
    await delay(150);
    return allMockListings().filter(
      (l) =>
        (!type || l.type === type) &&
        (!category || l.category === category),
    );
  },
  async get(id) {
    await delay(100);
    const listing = allMockListings().find((l) => l.id === id);
    if (!listing) throw new NotFoundError();
    return listing;
  },
  create: createMockListing,
};

async function getJson(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (res.status === 404) throw new NotFoundError();
  if (!res.ok) throw new Error(`Erreur API (${res.status})`);
  return res.json();
}

const apiSource = {
  async list({ type, category } = {}, signal) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (category) params.set('category', category);
    const qs = params.toString();
    const data = await getJson(`${API}/listings${qs ? `?${qs}` : ''}`, signal);
    return Array.isArray(data) ? data : (data.listings ?? data.items ?? []);
  },
  async get(id, signal) {
    const data = await getJson(`${API}/listings/${encodeURIComponent(id)}`, signal);
    return data.listing ?? data;
  },
  async create(values) {
    // `api` ajoute le token et lève une erreur portant `status` et `fields`.
    const data = await api('/listings', { method: 'POST', body: values });
    const listing = data?.listing ?? data;
    if (!listing?.id) throw new Error("L'annonce a été envoyée mais la réponse de l'API est vide.");
    return listing;
  },
};

const source = LISTINGS_SOURCE === 'api' ? apiSource : mockSource;

export async function listListings(filters, signal) {
  const listings = await source.list(filters, signal);
  // Les annonces terminées ne sont jamais proposées à la découverte, même si
  // l'API les renvoyait.
  return listings
    .map(normalizeListing)
    .filter((l) => l.status !== 'terminee')
    .sort(byNewest);
}

export async function getListing(id, signal) {
  return normalizeListing(await source.get(id, signal));
}

export async function createListing(values) {
  return normalizeListing(await source.create(values));
}
