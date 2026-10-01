// Copie côté client des constantes métier de `server/app/constants/domain.ts`
// (PR #2, PAND-4), qui reste la source de vérité. Toute modification doit être
// répercutée ici : mêmes clés ASCII, mêmes libellés.

const toOptions = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));

export const ZONES = toOptions({
  acoua: 'Acoua',
  bandraboua: 'Bandraboua',
  bandrele: 'Bandrélé',
  boueni: 'Bouéni',
  chiconi: 'Chiconi',
  chirongui: 'Chirongui',
  dembeni: 'Dembéni',
  dzaoudzi: 'Dzaoudzi-Labattoir',
  kani_keli: 'Kani-Kéli',
  koungou: 'Koungou',
  mamoudzou: 'Mamoudzou',
  mtsamboro: 'Mtsamboro',
  mtsangamouji: "M'Tsangamouji",
  ouangani: 'Ouangani',
  pamandzi: 'Pamandzi',
  sada: 'Sada',
  tsingoni: 'Tsingoni',
});

export const CATEGORIES = toOptions({
  objets: 'Objets & dons',
  outils: "Prêt d'outils",
  bricolage: 'Bricolage',
  jardinage: 'Jardinage',
  cours: 'Cours & soutien',
  transport: 'Transport & courses',
  garde: 'Garde (enfants, animaux)',
  coup_de_main: 'Coup de main',
});

export const TYPES = toOptions({
  offre: 'Offre',
  demande: 'Demande',
});

export const STATUSES = toOptions({
  disponible: 'Disponible',
  demandee: 'Demandée',
  acceptee: 'Acceptée',
  terminee: 'Terminée',
});

// Tolère les variantes accentuées ou en majuscules (« Demandée », « DEMANDEE »)
// en les ramenant à la clé ASCII ci-dessus.
export function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function labelFrom(list, value) {
  const key = normalizeKey(value);
  return list.find((item) => item.value === key)?.label ?? value ?? '';
}

export const typeLabel = (value) => labelFrom(TYPES, value);
export const categoryLabel = (value) => labelFrom(CATEGORIES, value);
export const zoneLabel = (value) => labelFrom(ZONES, value);
export const statusLabel = (value) => labelFrom(STATUSES, value);

export const isValidType = (value) => TYPES.some((t) => t.value === value);
export const isValidCategory = (value) => CATEGORIES.some((c) => c.value === value);
