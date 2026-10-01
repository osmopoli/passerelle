import { MOCK_LISTINGS } from './mockListings.js';
import { normalizeKey } from '../lib/constants.js';

// Adaptateur annonces. Par défaut il sert les données fictives ; avec
// VITE_LISTINGS_SOURCE=api il interroge l'API AdonisJS (contrat proposé dans
// PAND-8, à confirmer par PAND-7) :
//   GET /api/listings?type=&category=  → Listing[] (ou { listings: Listing[] })
//   GET /api/listings/:id              → Listing (ou { listing: Listing }), 404 sinon
export const LISTINGS_SOURCE = import.meta.env.VITE_LISTINGS_SOURCE === 'api' ? 'api' : 'mock';

const API = `${import.meta.env.BASE_URL}api`;

export class NotFoundError extends Error {}

function normalizeListing(raw) {
  return {
    ...raw,
    id: String(raw.id),
    type: normalizeKey(raw.type),
    category: normalizeKey(raw.category),
    status: normalizeKey(raw.status),
    author: raw.author
      ? { ...raw.author, zone: normalizeKey(raw.author.zone) }
      : null,
  };
}

function byNewest(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockSource = {
  async list({ type, category } = {}) {
    await delay(150);
    return MOCK_LISTINGS.filter(
      (l) =>
        (!type || l.type === type) &&
        (!category || l.category === category),
    );
  },
  async get(id) {
    await delay(100);
    const listing = MOCK_LISTINGS.find((l) => l.id === id);
    if (!listing) throw new NotFoundError();
    return listing;
  },
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
