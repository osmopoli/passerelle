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

async function createListing(author: User, status: ListingStatus = 'acceptee') {
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

async function statusOf(listing: Listing) {
  await listing.refresh()
  return listing.status
}

test.group('API clôture d’une annonce', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('l’auteur clôture une annonce acceptee, qui sort de la découverte', async ({
    client,
    assert,
  }) => {
    const author = await createUser('auteur@test.local')
    const listing = await createListing(author)

    const response = await client
      .post(`/api/listings/${listing.id}/close`)
      .bearerToken(await bearer(author))

    response.assertStatus(200)
    assert.equal(response.body().id, listing.id)
    assert.equal(response.body().status, 'terminee')
    assert.equal(response.body().author.id, author.id)
    assert.notProperty(response.body().author, 'email')
    assert.equal(await statusOf(listing), 'terminee')

    const discovery = await client.get('/api/listings')
    discovery.assertStatus(200)
    assert.notInclude(
      discovery.body().map((item: { id: number }) => item.id),
      listing.id
    )
  })

  test('un autre utilisateur que l’auteur reçoit 403', async ({ client, assert }) => {
    const listing = await createListing(await createUser('auteur@test.local'))

    const response = await client
      .post(`/api/listings/${listing.id}/close`)
      .bearerToken(await bearer(await createUser('intrus@test.local')))

    response.assertStatus(403)
    assert.equal(await statusOf(listing), 'acceptee')
  })

  test('le demandeur accepté reçoit 403 : seul l’auteur termine l’échange', async ({
    client,
    assert,
  }) => {
    const listing = await createListing(await createUser('auteur@test.local'))
    const requester = await createUser('demandeur@test.local')
    const exchangeRequest = await ExchangeRequest.create({
      listingId: listing.id,
      requesterId: requester.id,
      message: 'Bonjour',
      status: 'acceptee',
    })

    const response = await client
      .post(`/api/listings/${listing.id}/close`)
      .bearerToken(await bearer(requester))

    response.assertStatus(403)
    assert.equal(await statusOf(listing), 'acceptee')
    await exchangeRequest.refresh()
    assert.equal(exchangeRequest.status, 'acceptee')
  })

  for (const status of ['disponible', 'demandee', 'terminee'] as const) {
    test(`une annonce ${status} ne peut pas être clôturée (409)`, async ({ client, assert }) => {
      const author = await createUser('auteur@test.local')
      const listing = await createListing(author, status)

      const response = await client
        .post(`/api/listings/${listing.id}/close`)
        .bearerToken(await bearer(author))

      response.assertStatus(409)
      assert.equal(await statusOf(listing), status)
    })
  }

  test('sans connexion la route renvoie 401', async ({ client, assert }) => {
    const listing = await createListing(await createUser('auteur@test.local'))

    const response = await client.post(`/api/listings/${listing.id}/close`)
    response.assertStatus(401)
    assert.equal(await statusOf(listing), 'acceptee')
  })

  test('renvoie 404 pour une annonce inexistante', async ({ client }) => {
    const response = await client
      .post('/api/listings/999999/close')
      .bearerToken(await bearer(await createUser('auteur@test.local')))
    response.assertStatus(404)
  })
})
