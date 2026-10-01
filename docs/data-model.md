# Modèle de données PASSERELLE (PAND-4)

AdonisJS 6 · Lucid 21 · MySQL. Tables en `snake_case` ; l'API sérialise en `camelCase` (comportement Lucid par défaut).

Constantes partagées : `server/app/constants/domain.ts` (import `#constants/domain`).

## users

| Colonne | Type | Contraintes | JSON |
|---|---|---|---|
| id | int unsigned PK | auto | `id` |
| full_name | varchar(100) | not null | `fullName` |
| email | varchar(254) | not null, **unique** | `email` |
| password | varchar(255) | not null, hash (jamais sérialisé) | — |
| zone | varchar(32) | not null, index, ∈ `ZONE_VALUES` | `zone` |
| created_at / updated_at | timestamp | | `createdAt` / `updatedAt` |

## listings

| Colonne | Type | Contraintes | JSON |
|---|---|---|---|
| id | int unsigned PK | auto | `id` |
| user_id | int unsigned | FK users.id, ON DELETE CASCADE | `userId` |
| type | ENUM(`offre`,`demande`) | not null | `type` |
| category | varchar(32) | not null, ∈ `CATEGORY_VALUES` | `category` |
| title | varchar(120) | not null | `title` |
| description | text | not null (≤ 2000 côté validateur) | `description` |
| availability | varchar(255) | not null, texte libre | `availability` |
| status | ENUM(`disponible`,`demandee`,`acceptee`,`terminee`) | not null, défaut `disponible` | `status` |
| created_at / updated_at | timestamp | | `createdAt` / `updatedAt` |

Index : `listings_discovery_idx (status, type, category, created_at)`, plus l'index de la FK `user_id`.
Relations : `listing.author` (belongsTo User), `listing.requests` (hasMany ExchangeRequest).

## exchange_requests

| Colonne | Type | Contraintes | JSON |
|---|---|---|---|
| id | int unsigned PK | auto | `id` |
| listing_id | int unsigned | FK listings.id, ON DELETE CASCADE | `listingId` |
| requester_id | int unsigned | FK users.id, ON DELETE CASCADE | `requesterId` |
| message | varchar(1000) | not null (message unique de la demande) | `message` |
| status | ENUM(`en_attente`,`acceptee`,`refusee`) | not null, défaut `en_attente` | `status` |
| created_at / updated_at | timestamp | | `createdAt` / `updatedAt` |

Index : **unique (listing_id, requester_id)** (pas de doublon), (listing_id, status), (requester_id, status).
Relations : `request.listing`, `request.requester` ; côté User : `user.listings`, `user.sentRequests`.

## Constantes

- **Zones** (17 communes de Mayotte) : `acoua`, `bandraboua`, `bandrele`, `boueni`, `chiconi`, `chirongui`, `dembeni`, `dzaoudzi`, `kani_keli`, `koungou`, `mamoudzou`, `mtsamboro`, `mtsangamouji`, `ouangani`, `pamandzi`, `sada`, `tsingoni`.
- **Catégories** (8) : `objets`, `outils`, `bricolage`, `jardinage`, `cours`, `transport`, `garde`, `coup_de_main`.
- **Types** : `offre`, `demande`.
- **Statuts d'annonce** : `disponible` → `demandee` → `acceptee` → `terminee`.
- **Statuts de demande** : `en_attente`, `acceptee`, `refusee`.

Chaque constante expose `{ clé: libellé }` et un tableau `*_VALUES` (validateurs VineJS, selects du front).

## Choix

- Zone et catégorie en `varchar`, validées par l'app : on peut ajuster les listes sans `ALTER ENUM`. Les types et statuts, figés par le cadrage, sont en `ENUM` pour garantir l'intégrité en base.
- Les règles de transition (auto-refus, retour à `disponible`, etc.) relèvent de P1-2 et passent par une transaction applicative, pas par des triggers SQL.
