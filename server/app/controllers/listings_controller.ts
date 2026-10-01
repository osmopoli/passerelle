import type { HttpContext } from '@adonisjs/core/http'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import Listing from '#models/listing'
import { createListingValidator, listListingsValidator } from '#validators/listing'

/** Champs publics de l'auteur : pas d'email dans les réponses annonces. */
const preloadAuthor = (query: ModelQueryBuilderContract<typeof Listing>) =>
  query.preload('author', (author) => author.select('id', 'full_name', 'zone'))

export default class ListingsController {
  /** GET /api/listings?type=&category= : annonces non terminées, plus récentes d'abord. */
  async index({ request }: HttpContext) {
    const filters = await listListingsValidator.validate(request.qs())

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
    const payload = await request.validateUsing(createListingValidator)

    const listing = await Listing.create({ ...payload, userId: user.id, status: 'disponible' })
    await listing.load('author', (author) => author.select('id', 'full_name', 'zone'))

    return response.created(listing)
  }
}
