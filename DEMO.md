# PASSERELLE — démo jury (3 minutes)

Production : https://keepitsimple.mayotte.webcup.hodi.cloud/ — à présenter sur un téléphone ou en vue mobile 360 px.

## Avant la démo (T-15 min)

1. `GET /api/health` → `{"status":"ok","database":"ok"}`.
2. Rejouer le seed pour repartir d'un état propre :
   `cd server/build && node ace db:seed` (comptes remis à zéro par e-mail, annonces de démo recréées).
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
| 0:15 | Inscription (onglet 1) | Créer un compte « Jury » avec une zone | Compte et zone en 20 secondes, sans données superflues. |
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
2. Avoir les captures 360 px du parcours sous la main, sur l'appareil de démo : découverte, détail, demande envoyée, tableau de bord avant et après acceptation, après clôture, « Mes demandes ». Celles de PAND-16 (mode fictif) sont déjà jointes à l'issue. Les remplacer par des captures de prod dès que la recette passe.
3. En dernier recours, une vidéo écran de 3 minutes du script ci-dessus, enregistrée après la recette en prod.

## Recette du parcours critique en prod

À cocher en prod, à 360 px, après le merge de toutes les PR du parcours, les migrations et le seed.

- [ ] Inscription d'un nouveau compte avec zone, puis connexion et déconnexion
- [ ] Découverte : filtres type et catégorie, page détail
- [ ] Publication d'une annonce → statut `disponible`
- [ ] Demande depuis un 2e compte → annonce `demandee` ; une 2e demande du même compte est refusée (409)
- [ ] L'auteur ne peut pas demander sa propre annonce (403)
- [ ] Acceptation → demande `acceptee`, autres demandes `refusee`, annonce `acceptee`
- [ ] Un autre compte ne peut ni accepter, ni refuser, ni clôturer (403)
- [ ] Clôture par l'auteur → `terminee`, l'annonce disparaît de la découverte
- [ ] Refus de la dernière demande en attente → annonce `disponible`
- [ ] Tableau de bord : états vides des deux onglets

## Bugs bloquants

État au 02/10/2026, 00h10.

| # | Problème | Statut |
| --- | --- | --- |
| B1 | La prod n'expose que `/api/health` : `/api/listings` et `/api/me` répondent 404. Les PR #4 à #12 et #14 ne sont pas mergées. | Ouvert — merger dans l'ordre ci-dessous, puis migrations et seed en prod |
| B2 | Pas de page d'inscription dans le front intégré : le routeur (`client/src/App.jsx`) n'a que `/connexion`. L'écran d'inscription de PAND-5 (PR #6) remplace tout `App.jsx`, ce qui crée un conflit avec le routeur de PAND-8/9/15/16. | Ouvert — porter `AuthScreen` en route `/inscription` lors du merge de la PR #6 |
| B3 | Le front est buildé en mode `mock` par défaut (`VITE_LISTINGS_SOURCE`). Sans configuration, la prod affiche des données fictives. | Corrigé dans cette PR : `client/.env.production` force le mode `api` |
| B4 | Les PR backend #8, #10, #11 et #12 partent toutes de `main` et modifient `server/start/routes.ts` : leurs routes (demande, accepter/refuser, clôture, `/me/*`) entrent en conflit au merge. | Ouvert — à résoudre au merge, puis vérifier la liste des routes |

Ordre de merge proposé : #5 (annonces) → #6 (auth) → #7 (seed) → #8 → #10 → #11 → #12 → #4 → #9 → #14 → cette PR (en dernier, à cause de B3).
