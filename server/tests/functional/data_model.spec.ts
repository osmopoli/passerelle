import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Listing from '#models/listing'
import ExchangeRequest from '#models/exchange_request'

test.group('Modèle de données', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('crée un échange complet et charge les relations', async ({ assert }) => {
    const author = await User.create({
      fullName: 'Auteur',
      email: 'auteur@test.local',
      password: 'secret123',
      zone: 'mamoudzou',
    })
    const requester = await User.create({
      fullName: 'Demandeur',
      email: 'demandeur@test.local',
      password: 'secret123',
      zone: 'koungou',
    })
    const listing = await Listing.create({
      userId: author.id,
      type: 'offre',
      category: 'outils',
      title: 'Perceuse à prêter',
      description: 'Perceuse sans fil',
      availability: 'Le week-end',
    })
    await ExchangeRequest.create({
      listingId: listing.id,
      requesterId: requester.id,
      message: 'Dispo samedi ?',
    })

    await listing.refresh()
    assert.equal(listing.status, 'disponible')
    assert.notEqual(author.password, 'secret123')

    await listing.load('author')
    await listing.load('requests', (q) => q.preload('requester'))
    assert.equal(listing.author.zone, 'mamoudzou')
    assert.equal(listing.requests[0].status, 'en_attente')
    assert.equal(listing.requests[0].requester.email, 'demandeur@test.local')
    assert.notProperty(author.serialize(), 'password')
  })

  test('refuse une deuxième demande du même demandeur', async ({ assert }) => {
    const author = await User.create({
      fullName: 'A',
      email: 'a@test.local',
      password: 'x',
      zone: 'sada',
    })
    const requester = await User.create({
      fullName: 'B',
      email: 'b@test.local',
      password: 'x',
      zone: 'sada',
    })
    const listing = await Listing.create({
      userId: author.id,
      type: 'demande',
      category: 'jardinage',
      title: 'Aide pour tailler une haie',
      description: 'Une heure',
      availability: 'Mercredi',
    })
    const data = { listingId: listing.id, requesterId: requester.id, message: 'Je peux' }
    await ExchangeRequest.create(data)
    await assert.rejects(() => ExchangeRequest.create(data))
  })
})
