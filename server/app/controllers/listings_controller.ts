import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import Listing from '#models/listing'
import { createListingValidator, listListingsValidator } from '#validators/listing'

/** Champs publics de l'auteur : pas d'email dans les réponses annonces. */
const preloadAuthor = (query: ModelQueryBuilderContract<typeof Listing>) =>
  query.preload('author', (author) => author.select('id', 'full_name', 'zone'))

/**
 * Contrat annonces (PAND-7) : une saisie invalide renvoie 400. Limité à ce contrôleur
 * pour ne pas changer le 422 global utilisé par l'auth (PAND-5).
 */
async function validateOr400<T>(validate: () => Promise<T>, response: HttpContext['response']) {
  try {
    return { data: await validate() }
  } catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      response.badRequest({ errors: error.messages })
      return { data: null }
    }
    throw error
  }
}

export default class ListingsController {
  /** GET /api/listings?type=&category= : annonces non terminées, plus récentes d'abord. */
  async index({ request, response }: HttpContext) {
    const { data: filters } = await validateOr400(
      () => listListingsValidator.validate(request.qs()),
      response
    )
    if (!filters) return

    const query = Listing.query()
      .whereNot('status', 'terminee')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
    if (filters.type) query.where('type', filters.type)
    if (filters.category) query.where('category', filters.category)

    return preloadAuthor(query)
  }

  /** GET /api/listings/:id : détail avec l'auteur et sa zone. */
  async show({ params }: HttpContext) {
    return preloadAuthor(Listing.query().where('id', params.id)).firstOrFail()
  }

  /** POST /api/listings (authentifié) : l'annonce démarre au statut `disponible`. */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { data: payload } = await validateOr400(
      () => request.validateUsing(createListingValidator),
      response
    )
    if (!payload) return

    const listing = await Listing.create({ ...payload, userId: user.id, status: 'disponible' })
    await listing.load('author', (author) => author.select('id', 'full_name', 'zone'))

    return response.created(listing)
  }
}
