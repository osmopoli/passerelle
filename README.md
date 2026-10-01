# PASSERELLE

Plateforme locale d'offres, demandes et échanges entre habitants : proposez ou trouvez un objet, un service ou un coup de main près de chez vous, puis organisez l'échange en quelques clics.

## Stack

- **Front** : React + Vite + Tailwind CSS (`client/`)
- **Back** : Node.js + Express (`server/`)
- **Déploiement** : image Docker unique (le serveur sert l'API et le front buildé)

## Prérequis

- Node.js ≥ 20 et npm ≥ 10
- (optionnel) Docker

## Lancer en développement

```bash
npm install
npm run dev
```

Une seule commande démarre les deux applications :

- Front : http://localhost:5173 (les appels `/api` sont proxifiés vers le back)
- API : http://localhost:3000 — santé : http://localhost:3000/api/health

## Lancer en mode production (local)

```bash
npm install
npm run build   # build du front dans client/dist
npm start       # Express sert l'API + le front sur http://localhost:3000
```

Variable d'environnement : `PORT` (défaut `3000`), voir `.env.example`.

## Docker

```bash
docker build -t passerelle .
docker run --rm -p 3000:3000 passerelle
```

## Déploiement

Le fichier `render.yaml` permet un déploiement sur [Render](https://render.com) :
New → Blueprint → sélectionner le dépôt `osmopoli/passerelle`. Render construit le `Dockerfile` et vérifie `/api/health`.

Tout hébergeur acceptant un `Dockerfile` (Railway, Fly.io, Koyeb…) convient également ; il suffit d'exposer la variable `PORT`.

## Scripts

| Commande        | Effet                                      |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Front (Vite) + back (node --watch) en parallèle |
| `npm run build` | Build de production du front               |
| `npm start`     | Démarre le serveur Express (API + front)   |
