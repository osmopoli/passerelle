// Annonces publiées en mode fictif : conservées pour la session de l'onglet,
// afin qu'elles restent visibles dans la découverte après un rechargement.
// L'auteur est le compte fictif `moi` : elles apparaissent aussi dans
// « Mes annonces » du tableau de bord (PAND-16).
const MOCK_CREATED_KEY = 'passerelle:mock-created-listings';
const MOCK_AUTHOR = { id: 'moi', name: 'Vous (compte fictif)', zone: 'mamoudzou' };

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function readCreated() {
  try {
    return JSON.parse(sessionStorage.getItem(MOCK_CREATED_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function createMockListing(values) {
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
}
