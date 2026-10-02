// Annonces publiées en mode fictif : conservées pour la session de l'onglet,
// afin qu'elles restent visibles dans la découverte après un rechargement.
const MOCK_CREATED_KEY = 'passerelle:mock-created-listings';
const MOCK_AUTHOR = { id: 'moi', name: 'Vous (compte fictif)', zone: 'mamoudzou' };

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readCreated() {
  try {
    return JSON.parse(sessionStorage.getItem(MOCK_CREATED_KEY)) ?? [];
  } catch {
    return [];
  }
}

// Ajoute à la source fictive les annonces publiées dans l'onglet, et `create`.
export function withCreatedListings(source) {
  return {
    ...source,
    async list(filters = {}, signal) {
      const { type, category } = filters;
      const created = readCreated().filter(
        (l) => (!type || l.type === type) && (!category || l.category === category),
      );
      return [...created, ...(await source.list(filters, signal))];
    },
    async get(id, signal) {
      return readCreated().find((l) => l.id === id) ?? source.get(id, signal);
    },
    async create(values) {
      await delay(200);
      const listing = {
        ...values,
        id: `m${Date.now()}`,
        status: 'disponible',
        createdAt: new Date().toISOString(),
        author: MOCK_AUTHOR,
      };
      sessionStorage.setItem(MOCK_CREATED_KEY, JSON.stringify([listing, ...readCreated()]));
      return listing;
    },
  };
}
