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
        .first()

      if (!listing) {
        return { status: 404, error: 'Annonce introuvable' } as const
      }

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

  /**
   * POST /api/requests/:id/accept (auteur de l'annonce) : la demande passe à `acceptee`,
   * les autres demandes `en_attente` de l'annonce passent à `refusee`, l'annonce à `acceptee`.
   */
  async accept(ctx: HttpContext) {
    return this.decide(ctx, 'acceptee')
  }

  /**
   * POST /api/requests/:id/refuse (auteur de l'annonce) : la demande passe à `refusee` ;
   * s'il ne reste aucune demande `en_attente`, l'annonce revient à `disponible`.
   */
  async refuse(ctx: HttpContext) {
    return this.decide(ctx, 'refusee')
  }

  /**
   * Traitement commun, en une transaction. L'annonce est verrouillée avant la demande
   * (même ordre que `store`) pour sérialiser demandes et décisions sur une même annonce.
   */
  private async decide({ auth, params, response }: HttpContext, decision: 'acceptee' | 'refusee') {
    const user = auth.getUserOrFail()

    const result = await db.transaction(async (trx) => {
      const { listingId } = await ExchangeRequest.query({ client: trx })
        .where('id', params.id)
        .firstOrFail()
      const listing = await Listing.query({ client: trx })
        .where('id', listingId)
        .forUpdate()
        .firstOrFail()
      const exchangeRequest = await ExchangeRequest.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .firstOrFail()

      if (listing.userId !== user.id) {
        return {
          status: 403,
          error: "Seul l'auteur de l'annonce peut traiter cette demande",
        } as const
      }
      if (exchangeRequest.status !== 'en_attente') {
        return { status: 409, error: 'Cette demande a déjà été traitée' } as const
      }

      exchangeRequest.status = decision
      await exchangeRequest.save()

      if (decision === 'acceptee') {
        await ExchangeRequest.query({ client: trx })
          .where('listing_id', listing.id)
          .where('status', 'en_attente')
          .update({ status: 'refusee', updated_at: new Date() })
        listing.status = 'acceptee'
        await listing.save()
      } else {
        const pending = await ExchangeRequest.query({ client: trx })
          .where('listing_id', listing.id)
          .where('status', 'en_attente')
          .first()
        if (!pending && listing.status === 'demandee') {
          listing.status = 'disponible'
          await listing.save()
        }
      }

      exchangeRequest.$setRelated('listing', listing)
      return { status: 200, exchangeRequest } as const
    })

    if (result.status !== 200) {
      return response.status(result.status).send({ error: result.error })
    }
    return response.ok(result.exchangeRequest)
  }
}
