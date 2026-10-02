import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'
import type { ListingStatus } from '#constants/domain'

async function createUser(email: string) {
  return User.create({ fullName: 'Habitant', email, password: 'secret123', zone: 'mamoudzou' })
}

async function bearer(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function createListing(author: User, status: ListingStatus = 'disponible') {
  return Listing.create({
    userId: author.id,
    type: 'offre',
    category: 'outils',
    title: 'Perceuse à prêter',
    description: 'Perceuse sans fil avec deux batteries',
    availability: 'Le week-end',
    status,
  })
}

async function countRequests(listing: Listing) {
  const row = await ExchangeRequest.query()
    .where('listing_id', listing.id)
    .count('* as total')
    .first()
  return Number(row!.$extras.total)
}

test.group('API demande d’échange', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('refuse une demande sans être connecté (401)', async ({ client, assert }) => {
    const listing = await createListing(await createUser('auteur@test.local'))
    const response = await client.post(`/api/listings/${listing.id}/requests`).json({})

    response.assertStatus(401)
    assert.equal(await countRequests(listing), 0)
  })

  test('refuse de demander sa propre annonce (403)', async ({ client, assert }) => {
    const author = await createUser('auteur@test.local')
    const listing = await createListing(author)
    const response = await client
      .post(`/api/listings/${listing.id}/requests`)
      .bearerToken(await bearer(author))
      .json({})

    response.assertStatus(403)
    assert.equal(await countRequests(listing), 0)
  })

  for (const status of ['acceptee', 'terminee'] as const) {
    test(`refuse une demande sur une annonce ${status} (409)`, async ({ client, assert }) => {
      const listing = await createListing(await createUser('auteur@test.local'), status)
      const response = await client
        .post(`/api/listings/${listing.id}/requests`)
        .bearerToken(await bearer(await createUser('voisin@test.local')))
        .json({})

      response.assertStatus(409)
      assert.equal(await countRequests(listing), 0)
      await listing.refresh()
      assert.equal(listing.status, status)
    })
  }

  test('refuse une deuxième demande du même utilisateur (409)', async ({ client, assert }) => {
    const listing = await createListing(await createUser('auteur@test.local'))
    const token = await bearer(await createUser('voisin@test.local'))

    const first = await client
      .post(`/api/listings/${listing.id}/requests`)
      .bearerToken(token)
      .json({ message: 'Bonjour' })
    first.assertStatus(201)

    const second = await client
      .post(`/api/listings/${listing.id}/requests`)
      .bearerToken(token)
      .json({ message: 'Encore moi' })
    second.assertStatus(409)
    assert.equal(await countRequests(listing), 1)
  })

  test('crée la demande en_attente et passe l’annonce à demandee', async ({ client, assert }) => {
    const listing = await createListing(await createUser('auteur@test.local'))
    const requester = await createUser('voisin@test.local')

    const response = await client
      .post(`/api/listings/${listing.id}/requests`)
      .bearerToken(await bearer(requester))
      .json({ message: '  Je peux passer samedi  ', status: 'acceptee', requesterId: 999 })

    response.assertStatus(201)
    assert.equal(response.body().status, 'en_attente')
    assert.equal(response.body().listingId, listing.id)
    assert.equal(response.body().requesterId, requester.id)
    assert.equal(response.body().message, 'Je peux passer samedi')
    await listing.refresh()
    assert.equal(listing.status, 'demandee')
  })

  test('le message est optionnel et limité à 1000 caractères', async ({ client, assert }) => {
    const listing = await createListing(await createUser('auteur@test.local'))

    const tooLong = await client
      .post(`/api/listings/${listing.id}/requests`)
      .bearerToken(await bearer(await createUser('a@test.local')))
      .json({ message: 'x'.repeat(1001) })
    tooLong.assertStatus(422)
    assert.equal(tooLong.body().errors[0].field, 'message')

    const withoutMessage = await client
      .post(`/api/listings/${listing.id}/requests`)
      .bearerToken(await bearer(await createUser('b@test.local')))
      .json({})
    withoutMessage.assertStatus(201)
    assert.equal(withoutMessage.body().message, '')
  })

  test('une demande sur une annonce déjà demandee la laisse demandee', async ({
    client,
    assert,
  }) => {
    const listing = await createListing(await createUser('auteur@test.local'), 'demandee')
    const response = await client
      .post(`/api/listings/${listing.id}/requests`)
      .bearerToken(await bearer(await createUser('voisin@test.local')))
      .json({})

    response.assertStatus(201)
    await listing.refresh()
    assert.equal(listing.status, 'demandee')
  })

  test('renvoie 404 pour une annonce inexistante', async ({ client, assert }) => {
    const response = await client
      .post('/api/listings/999999/requests')
      .bearerToken(await bearer(await createUser('voisin@test.local')))
      .json({})
    response.assertStatus(404)
    assert.equal(response.body().error, 'Annonce introuvable')
  })

  test('annule la demande si la mise à jour de l’annonce échoue (transaction)', async ({
    client,
    assert,
  }) => {
    const listing = await createListing(await createUser('auteur@test.local'))
    const token = await bearer(await createUser('voisin@test.local'))

    const originalSave = Listing.prototype.save
    Listing.prototype.save = async function () {
      throw new Error('échec simulé de la mise à jour de l’annonce')
    }
    try {
      const response = await client
        .post(`/api/listings/${listing.id}/requests`)
        .bearerToken(token)
        .json({})
      response.assertStatus(500)
    } finally {
      Listing.prototype.save = originalSave
    }

    assert.equal(await countRequests(listing), 0)
    await listing.refresh()
    assert.equal(listing.status, 'disponible')
  })
})
