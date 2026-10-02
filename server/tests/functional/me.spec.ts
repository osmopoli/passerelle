import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'

async function createUser(email: string, zone: User['zone'] = 'mamoudzou') {
  return User.create({ fullName: `Habitant ${email}`, email, password: 'secret123', zone })
}

async function bearer(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

async function createListing(author: User, title: string) {
  return Listing.create({
    userId: author.id,
    type: 'offre',
    category: 'outils',
    title,
    description: 'Description de test',
    availability: 'Le week-end',
    status: 'demandee',
  })
}

async function createRequest(listing: Listing, requester: User, message = 'Bonjour') {
  return ExchangeRequest.create({
    listingId: listing.id,
    requesterId: requester.id,
    message,
    status: 'en_attente',
  })
}

test.group('API tableau de bord (/api/me)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  for (const path of ['/api/me/listings', '/api/me/requests']) {
    test(`${path} refuse sans connexion (401)`, async ({ client }) => {
      const response = await client.get(path)
      response.assertStatus(401)
    })
  }

  test('mes annonces : uniquement les miennes, avec les demandes reçues', async ({
    client,
    assert,
  }) => {
    const me = await createUser('moi@test.local')
    const other = await createUser('autre@test.local')
    const neighbour = await createUser('voisin@test.local', 'dzaoudzi')

    const older = await createListing(me, 'Ancienne annonce')
    const newer = await createListing(me, 'Nouvelle annonce')
    await createListing(other, 'Annonce d’un autre')
    await createRequest(newer, neighbour, 'Je peux passer samedi')
    await createRequest(older, other, 'Première demande')
    await createRequest(older, neighbour, 'Deuxième demande')

    const response = await client.get('/api/me/listings').bearerToken(await bearer(me))
    response.assertStatus(200)

    const body = response.body()
    assert.deepEqual(
      body.map((l: { id: number }) => l.id),
      [newer.id, older.id]
    )
    assert.equal(body[0].status, 'demandee')
    assert.equal(body[0].userId, me.id)
    assert.properties(body[0], ['createdAt', 'availability', 'requests'])

    const [request] = body[0].requests
    assert.equal(request.message, 'Je peux passer samedi')
    assert.equal(request.status, 'en_attente')
    assert.properties(request, ['requesterId', 'listingId', 'createdAt'])
    assert.deepEqual(request.requester, {
      id: neighbour.id,
      fullName: 'Habitant voisin@test.local',
      zone: 'dzaoudzi',
    })

    assert.deepEqual(
      body[1].requests.map((r: { message: string }) => r.message),
      ['Deuxième demande', 'Première demande']
    )
    assert.notInclude(JSON.stringify(body), 'password')
    assert.notInclude(JSON.stringify(body), '"email"')
  })

  test('mes demandes : uniquement les miennes, avec l’annonce et son auteur', async ({
    client,
    assert,
  }) => {
    const me = await createUser('moi@test.local')
    const author = await createUser('auteur@test.local', 'sada')
    const other = await createUser('autre@test.local')

    const first = await createListing(author, 'Perceuse')
    const second = await createListing(author, 'Cours de maths')
    const older = await createRequest(first, me, 'Ma première demande')
    const newer = await createRequest(second, me, 'Ma deuxième demande')
    await createRequest(first, other, 'Pas la mienne')

    const response = await client.get('/api/me/requests').bearerToken(await bearer(me))
    response.assertStatus(200)

    const body = response.body()
    assert.deepEqual(
      body.map((r: { id: number }) => r.id),
      [newer.id, older.id]
    )
    assert.equal(body[0].status, 'en_attente')
    assert.equal(body[0].requesterId, me.id)
    assert.equal(body[0].listing.title, 'Cours de maths')
    assert.equal(body[0].listing.status, 'demandee')
    assert.deepEqual(body[0].listing.author, {
      id: author.id,
      fullName: 'Habitant auteur@test.local',
      zone: 'sada',
    })
    assert.notInclude(JSON.stringify(body), 'password')
    assert.notInclude(JSON.stringify(body), '"email"')
  })

  test('renvoie des listes vides pour un nouvel utilisateur', async ({ client }) => {
    const token = await bearer(await createUser('nouveau@test.local'))

    const listings = await client.get('/api/me/listings').bearerToken(token)
    listings.assertStatus(200)
    listings.assertBody([])

    const requests = await client.get('/api/me/requests').bearerToken(token)
    requests.assertStatus(200)
    requests.assertBody([])
  })
})
