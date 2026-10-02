import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import type {
  Category,
  ExchangeRequestStatus,
  ListingStatus,
  ListingType,
  Zone,
} from '#constants/domain'
import User from '#models/user'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'

/** Mot de passe commun aux comptes de démo (documenté dans le README). */
export const DEMO_PASSWORD = 'Passerelle2026!'

type DemoUserKey = 'amina' | 'ibrahim' | 'claire'

export const DEMO_USERS: Record<DemoUserKey, { fullName: string; email: string; zone: Zone }> = {
  amina: { fullName: 'Amina Soilihi', email: 'amina@demo.passerelle.yt', zone: 'mamoudzou' },
  ibrahim: { fullName: 'Ibrahim Madi', email: 'ibrahim@demo.passerelle.yt', zone: 'koungou' },
  claire: { fullName: 'Claire Hoarau', email: 'claire@demo.passerelle.yt', zone: 'dembeni' },
}

type DemoListing = {
  author: DemoUserKey
  type: ListingType
  category: Category
  status: ListingStatus
  title: string
  description: string
  availability: string
  requests?: { from: DemoUserKey; status: ExchangeRequestStatus; message: string }[]
}

/**
 * 12 annonces cohérentes avec le cycle de statuts :
 * - disponible : aucune demande ;
 * - demandee : au moins une demande en attente ;
 * - acceptee / terminee : une demande acceptée, les autres refusées.
 */
const DEMO_LISTINGS: DemoListing[] = [
  {
    author: 'amina',
    type: 'offre',
    category: 'outils',
    status: 'disponible',
    title: 'Perceuse sans fil à prêter',
    description:
      'Perceuse-visseuse 18 V avec deux batteries et un coffret de mèches. Prêt pour quelques jours.',
    availability: 'En semaine après 17 h',
  },
  {
    author: 'amina',
    type: 'offre',
    category: 'cours',
    status: 'demandee',
    title: 'Soutien en maths pour collégiens',
    description:
      "Ancienne prof, j'aide en maths de la 6e à la 3e. Séance d'une heure chez moi ou à la médiathèque.",
    availability: 'Mercredi après-midi et samedi matin',
    requests: [
      {
        from: 'ibrahim',
        status: 'en_attente',
        message: 'Bonjour, mon fils est en 4e et bloque sur les fractions. Mercredi prochain ?',
      },
      {
        from: 'claire',
        status: 'en_attente',
        message: 'Ma fille prépare le brevet, une séance le samedi serait parfaite.',
      },
    ],
  },
  {
    author: 'amina',
    type: 'demande',
    category: 'transport',
    status: 'acceptee',
    title: 'Covoiturage jusqu’à la barge',
    description:
      'Je cherche quelqu’un pour me déposer à la barge de Mamoudzou mardi matin, je participe à l’essence.',
    availability: 'Mardi vers 7 h',
    requests: [
      {
        from: 'ibrahim',
        status: 'acceptee',
        message: 'Je passe par là tous les mardis, je peux vous prendre à 6 h 45.',
      },
      {
        from: 'claire',
        status: 'refusee',
        message: 'Je peux vous emmener si vous êtes prête à 7 h 30.',
      },
    ],
  },
  {
    author: 'amina',
    type: 'offre',
    category: 'objets',
    status: 'terminee',
    title: 'Lit bébé à donner',
    description: 'Lit à barreaux en bois avec matelas, en bon état. À venir chercher.',
    availability: 'Le week-end',
    requests: [
      {
        from: 'claire',
        status: 'acceptee',
        message: 'Bonjour, il serait parfait pour ma nièce. Je peux passer samedi.',
      },
    ],
  },
  {
    author: 'ibrahim',
    type: 'offre',
    category: 'jardinage',
    status: 'disponible',
    title: 'Débroussaillage de jardin',
    description:
      'J’ai une débroussailleuse et un peu de temps libre : je vous aide à dégager votre terrain.',
    availability: 'Samedi toute la journée',
  },
  {
    author: 'ibrahim',
    type: 'demande',
    category: 'bricolage',
    status: 'demandee',
    title: 'Aide pour monter une étagère',
    description:
      'Étagère murale à fixer sur du béton, il me manque une deuxième paire de bras et un niveau.',
    availability: 'En soirée cette semaine',
    requests: [
      {
        from: 'amina',
        status: 'en_attente',
        message: 'J’ai un niveau et la perceuse, je peux venir jeudi soir.',
      },
    ],
  },
  {
    author: 'ibrahim',
    type: 'offre',
    category: 'garde',
    status: 'acceptee',
    title: 'Je garde vos animaux pendant vos absences',
    description:
      'Nourrir, promener, donner de l’attention : je m’occupe de vos chats ou chiens près de Koungou.',
    availability: 'Pendant les vacances scolaires',
    requests: [
      {
        from: 'claire',
        status: 'acceptee',
        message: 'Je pars une semaine en novembre, pouvez-vous nourrir mes deux chats ?',
      },
    ],
  },
  {
    author: 'ibrahim',
    type: 'demande',
    category: 'coup_de_main',
    status: 'terminee',
    title: 'Coup de main pour un déménagement',
    description:
      'Je déménage dans le même quartier : quelques meubles à porter, une heure ou deux.',
    availability: 'Dimanche matin',
    requests: [
      { from: 'amina', status: 'acceptee', message: 'Je viens avec mon cousin, on sera là à 8 h.' },
      { from: 'claire', status: 'refusee', message: 'Je peux aider en fin de matinée.' },
    ],
  },
  {
    author: 'claire',
    type: 'offre',
    category: 'transport',
    status: 'disponible',
    title: 'Courses au marché couvert de Mamoudzou',
    description: 'J’y vais chaque samedi en voiture : je peux ramener vos courses ou vous emmener.',
    availability: 'Samedi matin',
  },
  {
    author: 'claire',
    type: 'demande',
    category: 'outils',
    status: 'disponible',
    title: 'Besoin d’une échelle',
    description: 'Échelle de 3 m environ pour nettoyer les gouttières, prêt pour une journée.',
    availability: 'N’importe quel jour de la semaine prochaine',
  },
  {
    author: 'claire',
    type: 'offre',
    category: 'cours',
    status: 'demandee',
    title: 'Initiation à la couture',
    description: 'Bases de la machine à coudre : ourlets, petites retouches. Machine fournie.',
    availability: 'Mardi et jeudi en fin d’après-midi',
    requests: [
      {
        from: 'ibrahim',
        status: 'en_attente',
        message: 'Ma femme aimerait apprendre, le jeudi lui irait bien.',
      },
    ],
  },
  {
    author: 'claire',
    type: 'demande',
    category: 'objets',
    status: 'disponible',
    title: 'Recherche cartable pour la rentrée',
    description: 'Cartable ou sac à dos pour un enfant de CE1, même usagé.',
    availability: 'Avant la fin du mois',
  },
]

/**
 * Données de démo rejouables : les comptes sont mis à jour par email, puis leurs
 * annonces (et, en cascade, les demandes reçues) sont supprimées et recréées.
 * Aucune autre donnée n'est touchée.
 */
export default class extends BaseSeeder {
  async run() {
    await db.transaction(async (trx) => {
      const users = {} as Record<DemoUserKey, User>
      for (const [key, attrs] of Object.entries(DEMO_USERS) as [
        DemoUserKey,
        (typeof DEMO_USERS)[DemoUserKey],
      ][]) {
        users[key] = await User.updateOrCreate(
          { email: attrs.email },
          { fullName: attrs.fullName, zone: attrs.zone, password: DEMO_PASSWORD },
          { client: trx }
        )
      }

      await Listing.query({ client: trx })
        .whereIn(
          'user_id',
          Object.values(users).map((user) => user.id)
        )
        .delete()

      const now = DateTime.now()
      for (const [index, { author, requests = [], ...attrs }] of DEMO_LISTINGS.entries()) {
        // Dates étalées pour un ordre d'affichage réaliste (plus récente en premier).
        const createdAt = now.minus({ hours: 6 * (DEMO_LISTINGS.length - index) })
        const listing = await Listing.create(
          { ...attrs, userId: users[author].id, createdAt },
          { client: trx }
        )
        for (const [offset, { from, ...request }] of requests.entries()) {
          await ExchangeRequest.create(
            {
              ...request,
              listingId: listing.id,
              requesterId: users[from].id,
              createdAt: createdAt.plus({ hours: offset + 1 }),
            },
            { client: trx }
          )
        }
      }
    })
  }
}
