/**
 * Constantes métier partagées PASSERELLE (source de vérité unique).
 * Les valeurs stockées en base sont les clés ASCII ; les libellés servent à l'UI.
 */

export const ZONES = {
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
} as const
export type Zone = keyof typeof ZONES
export const ZONE_VALUES = Object.keys(ZONES) as Zone[]

export const CATEGORIES = {
  objets: 'Objets & dons',
  outils: "Prêt d'outils",
  bricolage: 'Bricolage',
  jardinage: 'Jardinage',
  cours: 'Cours & soutien',
  transport: 'Transport & courses',
  garde: 'Garde (enfants, animaux)',
  coup_de_main: 'Coup de main',
} as const
export type Category = keyof typeof CATEGORIES
export const CATEGORY_VALUES = Object.keys(CATEGORIES) as Category[]

export const LISTING_TYPES = {
  offre: 'Offre',
  demande: 'Demande',
} as const
export type ListingType = keyof typeof LISTING_TYPES
export const LISTING_TYPE_VALUES = Object.keys(LISTING_TYPES) as ListingType[]

/** Cycle d'une annonce : disponible → demandee → acceptee → terminee (cf. PAND-2). */
export const LISTING_STATUSES = {
  disponible: 'Disponible',
  demandee: 'Demandée',
  acceptee: 'Acceptée',
  terminee: 'Terminée',
} as const
export type ListingStatus = keyof typeof LISTING_STATUSES
export const LISTING_STATUS_VALUES = Object.keys(LISTING_STATUSES) as ListingStatus[]

export const EXCHANGE_REQUEST_STATUSES = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
} as const
export type ExchangeRequestStatus = keyof typeof EXCHANGE_REQUEST_STATUSES
export const EXCHANGE_REQUEST_STATUS_VALUES = Object.keys(
  EXCHANGE_REQUEST_STATUSES
) as ExchangeRequestStatus[]

/** Longueurs max, alignées sur les colonnes SQL (à réutiliser dans les validateurs). */
export const LIMITS = {
  fullName: 100,
  email: 254,
  title: 120,
  description: 2000,
  availability: 255,
  message: 1000,
} as const
