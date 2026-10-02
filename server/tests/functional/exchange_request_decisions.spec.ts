import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'
import type { ExchangeRequestStatus, ListingStatus } from '#constants/domain'

async function createUser(email: string) {
  return User.create({ fullName: 'Habitant', email, password: 'secret123', zone: 'mamoudzou' })
}

async function bearer(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function createListing(author: User, status: ListingStatus = 'demandee') {
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

async function createRequest(
  listing: Listing,
  email: string,
  status: ExchangeRequestStatus = 'en_attente'
) {
  const requester = await createUser(email)
  return ExchangeRequest.create({
    listingId: listing.id,
    requesterId: requester.id,
    message: 'Bonjour',
    status,
  })
}

async function statusOf(model: Listing | ExchangeRequest) {
  await model.refresh()
  return model.status
}

test.group('API acceptation / refus d’une demande', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('accepter passe la demande et l’annonce à acceptee et refuse les autres demandes en attente', async ({
    client,
    assert,
  }) => {
    const author = await createUser('auteur@test.local')
    const listing = await createListing(author)
    const chosen = await createRequest(listing, 'a@test.local')
    const other = await createRequest(listing, 'b@test.local')
    const alreadyRefused = await createRequest(listing, 'c@test.local', 'refusee')
    const otherListing = await createListing(author)
    const elsewhere = await createRequest(otherListing, 'd@test.local')

    const response = await client
      .post(`/api/requests/${chosen.id}/accept`)
      .bearerToken(await bearer(author))

    response.assertStatus(200)
    assert.equal(response.body().status, 'acceptee')
    assert.equal(response.body().listing.status, 'acceptee')
    assert.equal(await statusOf(chosen), 'acceptee')
    assert.equal(await statusOf(other), 'refusee')
    assert.equal(await statusOf(alreadyRefused), 'refusee')
    assert.equal(await statusOf(listing), 'acceptee')
    assert.equal(await statusOf(elsewhere), 'en_attente')
    assert.equal(await statusOf(otherListing), 'demandee')
  })

  test('refuser la dernière demande en attente remet l’annonce à disponible', async ({
    client,
    assert,
  }) => {
    const author = await createUser('auteur@test.local')
    const listing = await createListing(author)
    const first = await createRequest(listing, 'a@test.local')
    const last = await createRequest(listing, 'b@test.local')
    const token = await bearer(author)

    const response = await client.post(`/api/requests/${first.id}/refuse`).bearerToken(token)
    response.assertStatus(200)
    assert.equal(response.body().status, 'refusee')
    assert.equal(await statusOf(first), 'refusee')
    assert.equal(await statusOf(listing), 'demandee')

    const lastResponse = await client.post(`/api/requests/${last.id}/refuse`).bearerToken(token)
    lastResponse.assertStatus(200)
    assert.equal(lastResponse.body().listing.status, 'disponible')
    assert.equal(await statusOf(last), 'refusee')
    assert.equal(await statusOf(listing), 'disponible')
  })

  for (const action of ['accept', 'refuse'] as const) {
    test(`${action} : un autre utilisateur que l’auteur reçoit 403`, async ({ client, assert }) => {
      const listing = await createListing(await createUser('auteur@test.local'))
      const exchangeRequest = await createRequest(listing, 'a@test.local')
      const requester = await User.findOrFail(exchangeRequest.requesterId)

      for (const intruder of [requester, await createUser('intrus@test.local')]) {
        const response = await client
          .post(`/api/requests/${exchangeRequest.id}/${action}`)
          .bearerToken(await bearer(intruder))
        response.assertStatus(403)
      }
      assert.equal(await statusOf(exchangeRequest), 'en_attente')
      assert.equal(await statusOf(listing), 'demandee')
    })

    test(`${action} : sans connexion la route renvoie 401`, async ({ client, assert }) => {
      const listing = await createListing(await createUser('auteur@test.local'))
      const exchangeRequest = await createRequest(listing, 'a@test.local')

      const response = await client.post(`/api/requests/${exchangeRequest.id}/${action}`)
      response.assertStatus(401)
      assert.equal(await statusOf(exchangeRequest), 'en_attente')
    })

    for (const status of ['acceptee', 'refusee'] as const) {
      test(`${action} : une demande ${status} ne peut plus être traitée (409)`, async ({
        client,
        assert,
      }) => {
        const author = await createUser('auteur@test.local')
        const listing = await createListing(author, status === 'acceptee' ? 'acceptee' : 'demandee')
        const exchangeRequest = await createRequest(listing, 'a@test.local', status)

        const response = await client
          .post(`/api/requests/${exchangeRequest.id}/${action}`)
          .bearerToken(await bearer(author))
        response.assertStatus(409)
        assert.equal(await statusOf(exchangeRequest), status)
      })
    }
  }

  test('renvoie 404 pour une demande inexistante', async ({ client }) => {
    const response = await client
      .post('/api/requests/999999/accept')
      .bearerToken(await bearer(await createUser('auteur@test.local')))
    response.assertStatus(404)
  })

  test('annule toute l’acceptation si la mise à jour de l’annonce échoue (transaction)', async ({
    client,
    assert,
  }) => {
    const author = await createUser('auteur@test.local')
    const listing = await createListing(author)
    const chosen = await createRequest(listing, 'a@test.local')
    const other = await createRequest(listing, 'b@test.local')
    const token = await bearer(author)

    const originalSave = Listing.prototype.save
    Listing.prototype.save = async function () {
      throw new Error('échec simulé de la mise à jour de l’annonce')
    }
    try {
      const response = await client.post(`/api/requests/${chosen.id}/accept`).bearerToken(token)
      response.assertStatus(500)
    } finally {
      Listing.prototype.save = originalSave
    }

    assert.equal(await statusOf(chosen), 'en_attente')
    assert.equal(await statusOf(other), 'en_attente')
    assert.equal(await statusOf(listing), 'demandee')
  })
})
