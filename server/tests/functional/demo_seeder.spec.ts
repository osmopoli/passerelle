import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Listing from '#models/listing'
import { CATEGORY_VALUES, LISTING_STATUS_VALUES } from '#constants/domain'
import DemoSeeder, { DEMO_PASSWORD, DEMO_USERS } from '#database/seeders/demo_seeder'

test.group('Seed de démo', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('peut être rejoué et couvre types, catégories, zones et statuts', async ({ assert }) => {
    await new DemoSeeder(db.connection()).run()
    await new DemoSeeder(db.connection()).run()

    const emails = Object.values(DEMO_USERS).map((user) => user.email)
    const users = await User.query().whereIn('email', emails)
    assert.lengthOf(users, 3)
    assert.isTrue(await hash.verify(users[0].password, DEMO_PASSWORD))

    const listings = await Listing.query()
      .whereIn(
        'user_id',
        users.map((user) => user.id)
      )
      .preload('author')
      .preload('requests')
    assert.lengthOf(listings, 12)
    assert.sameMembers([...new Set(listings.map((l) => l.type))], ['offre', 'demande'])
    assert.sameMembers([...new Set(listings.map((l) => l.category))], CATEGORY_VALUES)
    assert.lengthOf(new Set(listings.map((l) => l.author.zone)), 3)
    assert.sameMembers([...new Set(listings.map((l) => l.status))], LISTING_STATUS_VALUES)

    for (const listing of listings) {
      const statuses = listing.requests.map((r) => r.status)
      if (listing.status === 'disponible') assert.isEmpty(statuses)
      if (listing.status === 'demandee') assert.include(statuses, 'en_attente')
      if (listing.status === 'acceptee' || listing.status === 'terminee') {
        assert.equal(statuses.filter((s) => s === 'acceptee').length, 1)
        assert.notInclude(statuses, 'en_attente')
      }
      assert.notInclude(
        listing.requests.map((r) => r.requesterId),
        listing.userId,
        'un auteur ne demande pas sa propre annonce'
      )
    }
  })
})
