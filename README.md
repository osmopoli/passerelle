# PASSERELLE

Plateforme locale d'offres, demandes et échanges entre habitants : proposez ou trouvez un objet, un service ou un coup de main près de chez vous, puis organisez l'échange en quelques clics.

## Stack

| Couche   | Technologie                                             |
| -------- | ------------------------------------------------------- |
| Front    | React 19 + Vite 7 + Tailwind CSS 4 (`client/`)          |
| Back     | AdonisJS 6 (API) + Lucid 21.8 + guard `access_tokens` (`server/`) |
| Base     | MySQL                                                   |
| Runtime  | Node.js 22                                              |
| Cible    | HODI / cPanel (Phusion Passenger). Docker possible en alternative |

> ⚠️ Rester sur **AdonisJS 6** : ne jamais lancer `npm audit fix --force`, car cela migrerait vers Adonis 7.

## Prérequis

- Node.js 22 et npm ≥ 10
- Une base MySQL accessible

## Installation

```bash
npm install                      # installe aussi client/ et server/ (postinstall)
cp server/.env.example server/.env
node server/ace.js generate:key  # remplit APP_KEY dans server/.env
# Renseigner DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_DATABASE dans server/.env
npm run migrate                  # applique les migrations Lucid
```

## Lancer en développement

```bash
npm run dev
```

Une seule commande démarre les deux applications :

- Front : http://localhost:5173 (les appels `/api` sont proxifiés vers le back)
- API : http://localhost:3333. Santé : http://localhost:3333/api/health

`GET /api/health` renvoie `{"status":"ok","service":"passerelle","database":"ok|error","time":"…"}`.

## Build de production

```bash
npm run build   # 1) React -> server/public   2) AdonisJS -> server/build
```

`server/build/` est une application autonome : elle contient l'API compilée, le front (`public/`), `package.json`, `package-lock.json` et `loader.cjs`. AdonisJS sert le front lui-même :

- les fichiers statiques de `public/` sont servis par `@adonisjs/static` ;
- les routes inconnues hors `/api` renvoient `public/index.html` (fallback SPA) ;
- les routes `/api/*` inconnues renvoient une 404 JSON.

Aucune règle Apache n'est donc nécessaire.

Lancement local du build :

```bash
cd server/build
npm ci --omit=dev
cp -f ../.env .env      # NODE_ENV=production
node bin/server.js      # ou : node loader.cjs
```

### Sous-chemin (ex. `/spike`)

Passenger retire le préfixe de l'URL avant de passer la requête à l'application : les routes ne connaissent jamais `/spike`. Seul le front doit savoir où se trouvent ses assets et son API. Pour un déploiement sous un sous-chemin, il faut donc builder avec :

```bash
VITE_BASE=/spike/ npm run build
```

Sans `VITE_BASE`, le front est buildé pour la racine du domaine (`/`).

## Déploiement HODI / cPanel (Passenger)

Passenger charge le fichier de démarrage en CommonJS, alors qu'AdonisJS 6 est en ESM. `server/loader.cjs` fait le pont avec un `import('./bin/server.js')`. Il est copié automatiquement dans `server/build/`.

**Configuration de l'application Node.js dans cPanel :**

- Node.js : `22.23.2`
- Mode : `Production`
- Application root : `passerelle/server/build`
- Application URL : `/spike` pour le staging, puis la racine
- Startup file : `loader.cjs`
- Log Passenger : chemin vers un **fichier** `.log`, pas un dossier
- Le fichier `server/.env` doit avoir `NODE_ENV=production`, un `APP_KEY` et les variables `DB_*` de la base MySQL cPanel

**Runbook (dans le clone `/home/keepitsimple/passerelle`) :**

```bash
export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
git pull
npm ci                              # installe client/ et server/
VITE_BASE=/spike/ npm run build     # VITE_BASE=/ (ou rien) pour la racine

cd server/build
npm ci --omit=dev
cp -f ../.env .env
node ace migration:run --force

mkdir -p tmp
touch tmp/restart.txt
sleep 5
```

**Contrôles :**

```bash
curl -i https://keepitsimple.mayotte.webcup.hodi.cloud/spike/api/health   # 200, database "ok"
curl -i https://keepitsimple.mayotte.webcup.hodi.cloud/spike/              # page React
curl -i https://keepitsimple.mayotte.webcup.hodi.cloud/spike/annonces/1    # fallback SPA (200)
npm audit --omit=dev                # aucune vulnérabilité high
npm ls @faker-js/faker              # 10.5.0 overridden
```

Valider sur `/spike` avant de remplacer l'application montée à la racine du domaine.

## Docker (alternative)

```bash
docker build -t passerelle .
docker run --rm -p 3333:3333 \
  -e APP_KEY=... -e DB_HOST=... -e DB_PORT=3306 \
  -e DB_USER=... -e DB_PASSWORD=... -e DB_DATABASE=... \
  passerelle
```

Le conteneur applique les migrations au démarrage. `render.yaml` décrit le même service pour Render, qui exige une base MySQL externe.

## Règles de sécurité

- `@faker-js/faker` est forcé en `10.5.0` (`overrides` dans `server/package.json`).
- Ne pas utiliser `response.redirect().back()` ni `redirect('back')` : utiliser uniquement des chemins de redirection explicites. L'advisory « open redirect » d'`@adonisjs/http-server` (modéré) n'est corrigé qu'en v7.
- L'avertissement `edge-lexer >= Node 24` ne concerne pas l'arbre de production.

## Scripts (racine)

| Commande          | Effet                                                    |
| ----------------- | -------------------------------------------------------- |
| `npm install`     | Dépendances racine, `client/` et `server/`               |
| `npm run dev`     | Front (Vite) + API (AdonisJS, HMR) en parallèle          |
| `npm run build`   | Build React dans `server/public`, puis build AdonisJS dans `server/build` |
| `npm start`       | Démarre `server/build` (après `npm ci --omit=dev` dedans) |
| `npm run migrate` | Applique les migrations Lucid                            |
