import type { HttpContext } from '@adonisjs/core/http'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'

/** Champs publics d'un utilisateur : pas d'email ni de mot de passe. */
const PUBLIC_USER_COLUMNS = ['id', 'full_name', 'zone']

export default class MeController {
  /** GET /api/me/listings (authentifié) : mes annonces et les demandes reçues, plus récentes d'abord. */
  async listings({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return Listing.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .preload('requests', (requests) =>
        requests
          .orderBy('created_at', 'desc')
          .orderBy('id', 'desc')
          .preload('requester', (requester) => requester.select(PUBLIC_USER_COLUMNS))
      )
  }

  /** GET /api/me/requests (authentifié) : mes demandes envoyées avec l'annonce et son auteur. */
  async requests({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return ExchangeRequest.query()
      .where('requester_id', user.id)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .preload('listing', (listing) =>
        listing.preload('author', (author) => author.select(PUBLIC_USER_COLUMNS))
      )
  }
}
