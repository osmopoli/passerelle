import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'
import { createExchangeRequestValidator } from '#validators/exchange_request'

export default class ExchangeRequestsController {
  /**
   * POST /api/listings/:id/requests (authentifié) : demande au statut `en_attente`.
   * La première demande fait passer l'annonce de `disponible` à `demandee`,
   * dans la même transaction (annonce verrouillée pour sérialiser les demandes).
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { message } = await request.validateUsing(createExchangeRequestValidator)

    const result = await db.transaction(async (trx) => {
      const listing = await Listing.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .firstOrFail()

      if (listing.userId === user.id) {
        return { status: 403, error: 'Impossible de demander sa propre annonce' } as const
      }
      if (listing.status === 'acceptee' || listing.status === 'terminee') {
        return { status: 409, error: "Cette annonce n'accepte plus de demandes" } as const
      }

      const existing = await ExchangeRequest.query({ client: trx })
        .where('listing_id', listing.id)
        .where('requester_id', user.id)
        .first()
      if (existing) {
        return { status: 409, error: 'Vous avez déjà demandé cette annonce' } as const
      }

      const exchangeRequest = await ExchangeRequest.create(
        {
          listingId: listing.id,
          requesterId: user.id,
          message: message ?? '',
          status: 'en_attente',
        },
        { client: trx }
      )

      if (listing.status === 'disponible') {
        listing.status = 'demandee'
        await listing.save()
      }

      return { status: 201, exchangeRequest } as const
    })

    if (result.status !== 201) {
      return response.status(result.status).send({ error: result.error })
    }
    return response.created(result.exchangeRequest)
  }
}
