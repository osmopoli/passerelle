# PASSERELLE — démo jury (3 minutes)

Production : https://keepitsimple.mayotte.webcup.hodi.cloud/ — à présenter sur un téléphone ou en vue mobile 360 px.

## Avant la démo (T-15 min)

1. `GET /api/health` → `{"status":"ok","database":"ok"}`.
2. Rejouer le seed pour repartir d'un état propre :
   `cd server/build && node ace db:seed` (comptes remis à zéro par e-mail, annonces de démo recréées).
   **En prod, cette commande est lancée uniquement par osmopoli8.** Aucun agent ne lance le seed ni les migrations en prod.
3. Vider le stockage local du navigateur de démo (`passerelle_token`, `passerelle:sent-requests`).
4. Ouvrir deux onglets : un en navigation normale, un en navigation privée (deux comptes en parallèle).
5. Préparer le plan B (voir plus bas) sur le même appareil, hors ligne.

## Comptes de démo

Mot de passe commun : `Passerelle2026!`

| Rôle dans la démo | Compte | E-mail | Zone |
| --- | --- | --- | --- |
| Auteur d'annonces, reçoit des demandes | Amina Soilihi | `amina@demo.passerelle.yt` | Mamoudzou |
| Demandeur (2e compte) | Ibrahim Madi | `ibrahim@demo.passerelle.yt` | Koungou |
| Demandeuse, compte de secours | Claire Hoarau | `claire@demo.passerelle.yt` | Dembéni |

Ces comptes sont publics (mot de passe dans le dépôt). Ils ne doivent contenir aucune donnée réelle. Rejouer le seed juste avant le jury remet leurs mots de passe et leurs annonces à zéro.

## Script (3 min)

| Temps | Écran | Action | Ce qu'on dit |
| --- | --- | --- | --- |
| 0:00 | Accueil | Présenter la promesse | « Proposez ou trouvez un objet, un service ou un coup de main près de chez vous. » |
| 0:15 | `/connexion`, onglet « Inscription » (onglet 1) | Créer un compte « Jury » avec une zone | Compte et zone en 20 secondes, sans données superflues. |
| 0:40 | Découverte | Filtrer par type puis par catégorie, ouvrir un détail | Les annonces terminées n'apparaissent plus. |
| 1:00 | `/publier` | Publier une offre « Prêt d'une échelle », disponibilité en texte libre | L'annonce démarre au statut **disponible**. |
| 1:25 | Onglet 2 (privé), connecté en Ibrahim | Ouvrir l'annonce, envoyer une demande avec un message | Un seul message par demande ; l'annonce passe à **demandée**. |
| 1:50 | Onglet 1, `/tableau-de-bord` → « Mes annonces » | **Accepter** la demande d'Ibrahim | Les autres demandes en attente sont refusées automatiquement ; l'annonce passe à **acceptée**. |
| 2:15 | Onglet 2, « Mes demandes » | Montrer le statut **acceptée** | Le demandeur voit le résultat sans relancer. |
| 2:30 | Onglet 1 | **Marquer comme terminé** | Seul l'auteur clôture ; l'annonce sort de la découverte. |
| 2:45 | Conclusion | — | Hors périmètre volontaire : chat, carte, photos, paiement. |

Variante refus, si on vous la demande (30 s) : connecté en Amina, « Soutien en maths pour collégiens » a deux demandes en attente. Refuser les deux : l'annonce revient à **disponible**.

## Plan B (panne réseau ou prod indisponible)

1. Lancer le projet en local, sans réseau, avec les données fictives du front : `npm run dev --prefix client` (mode `mock` par défaut). Tout le parcours fonctionne sans API.
2. Avoir sur l'appareil de démo les captures 360 px du parcours en prod, prises à la recette du 02/10 et jointes à PAND-17 : inscription, publication, détail, demande envoyée, tableau de bord avant et après acceptation, « Mes demandes », après clôture.
3. En dernier recours, une vidéo écran de 3 minutes du script ci-dessus.

## Recette du parcours critique en prod

Jouée le 02/10/2026 vers 07h40 (heure de Mayotte), en prod, après le merge des PR du parcours, les migrations et le seed. Interface en 360 px (Playwright, deux sessions séparées), API par script (43 contrôles, 42 OK et 1 écart de test sans impact). Toutes les annonces de recette (`[Recette] …`, comptes `recette-*@example.com`) ont été clôturées : elles n'apparaissent pas dans la découverte.

- [x] Inscription d'un nouveau compte avec zone (interface : `/connexion` → « Inscription »), déconnexion, jeton révoqué (401)
- [x] Découverte : liste des annonces du seed, filtres type et catégorie (API), page détail sans e-mail de l'auteur
- [x] Publication d'une annonce → statut `disponible` (interface)
- [x] Demande depuis un 2e compte → annonce `demandee` (interface) ; une 2e demande du même compte est refusée (409)
- [x] L'auteur ne peut pas demander sa propre annonce : « C'est votre annonce » dans l'interface, 403 côté API
- [x] Acceptation → demande `acceptee`, autres demandes `refusee`, annonce `acceptee` (interface et API)
- [x] Un autre compte ne peut ni accepter, ni refuser, ni clôturer (403) ; le demandeur ne peut pas accepter sa propre demande (403) ; sans jeton (401)
- [x] Clôture par l'auteur → `terminee`, l'annonce disparaît de la découverte (interface)
- [x] Refus de la dernière demande en attente → annonce `disponible` (API)
- [x] Tableau de bord : état vide « Mes demandes » vérifié en prod ; état vide « Mes annonces » vérifié en mode fictif (PAND-16)
- [x] Aucun débordement horizontal à 360 px (`/`, détail, `/publier`, `/tableau-de-bord`, `/connexion`)

## Bugs bloquants

État au 02/10/2026, 07h45 (heure de Mayotte). Toutes les PR du parcours sont mergées (#4 à #12, #14, #15). Seule la PR #13 (restyle, non bloquante) reste ouverte.

| # | Problème | Statut |
| --- | --- | --- |
| B1 | `/api/listings` répondait 500 (migrations pas lancées en prod). | Résolu — migrations et seed lancés par osmopoli8 ; `/api/listings` répond 200 avec les annonces de démo |
| B2 | Pas de route `/inscription`. | Résolu — inscription par `/connexion` → « Inscription », vérifiée en prod |
| B3 | Front buildé en mode `mock` par défaut. | Résolu — `client/.env.production` (arrivé avec #9 et #15) ; la prod lit bien l'API |
| B4 | Conflits sur `server/start/routes.ts`. | Résolu — toutes les routes du parcours sont présentes et protégées par `middleware.auth()` |
| B5 | Bouton « Demander » absent de `main`. | Résolu — PR #9 mergée, demande vérifiée en prod |

Aucun bug bloquant ouvert. Points mineurs, à documenter, sans correction avant la démo :

- `favicon.ico` répond 404 (erreur dans la console, sans effet visible).
- La console affiche « Download the React DevTools » : le bundle de prod semble construit avec React en mode développement (plus lourd, environ 518 ko). À vérifier côté build Hodifly (`NODE_ENV`), sans effet sur le parcours.
- Les erreurs de validation renvoient 400 (et non 422) avec `{ errors: [...] }`. C'est le contrat attendu par le front, sans trace de pile.