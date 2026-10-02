import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Listing from '#models/listing'

const validPayload = {
  type: 'offre',
  category: 'outils',
  title: 'Perceuse à prêter',
  description: 'Perceuse sans fil avec deux batteries',
  availability: 'Le week-end',
}

async function createUser(email: string, zone: User['zone'] = 'mamoudzou') {
  return User.create({ fullName: 'Habitant', email, password: 'secret123', zone })
}

async function bearer(user: User) {
  const token = await User.accessTokens.create(user)
  return token.value!.release()
}

test.group('API annonces', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('refuse la création sans être connecté', async ({ client }) => {
    const response = await client.post('/api/listings').json(validPayload)
    response.assertStatus(401)
  })

  test('crée une annonce au statut disponible pour l’utilisateur connecté', async ({
    client,
    assert,
  }) => {
    const user = await createUser('auteur@test.local', 'koungou')
    const response = await client
      .post('/api/listings')
      .bearerToken(await bearer(user))
      .json({ ...validPayload, status: 'terminee', userId: 999 })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.status, 'disponible')
    assert.equal(body.userId, user.id)
    assert.equal(body.author.zone, 'koungou')
  })

  test('renvoie 400 si un champ obligatoire manque', async ({ client, assert }) => {
    const user = await createUser('auteur@test.local')
    const { title, ...withoutTitle } = validPayload
    const response = await client
      .post('/api/listings')
      .bearerToken(await bearer(user))
      .json(withoutTitle)

    response.assertStatus(400)
    assert.equal(response.body().errors[0].field, 'title')
    assert.equal(
      await Listing.query()
        .count('* as total')
        .first()
        .then((r) => r!.$extras.total),
      0
    )
  })

  test('filtre la liste par type et catégorie et exclut les annonces terminées', async ({
    client,
    assert,
  }) => {
    const user = await createUser('auteur@test.local')
    const base = { ...validPayload, userId: user.id }
    await Listing.createMany([
      { ...base, title: 'Offre outils', type: 'offre', category: 'outils' },
      { ...base, title: 'Demande outils', type: 'demande', category: 'outils' },
      { ...base, title: 'Offre jardinage', type: 'offre', category: 'jardinage' },
      {
        ...base,
        title: 'Offre outils terminée',
        type: 'offre',
        category: 'outils',
        status: 'terminee',
      },
    ])

    const all = await client.get('/api/listings')
    all.assertStatus(200)
    assert.sameMembers(
      all.body().map((l: { title: string }) => l.title),
      ['Offre outils', 'Demande outils', 'Offre jardinage']
    )

    const filtered = await client.get('/api/listings').qs({ type: 'offre', category: 'outils' })
    assert.deepEqual(
      filtered.body().map((l: { title: string }) => l.title),
      ['Offre outils']
    )

    const invalid = await client.get('/api/listings').qs({ category: 'inconnue' })
    invalid.assertStatus(400)
  })

  test('le détail renvoie l’auteur et sa zone, sans son email', async ({ client, assert }) => {
    const user = await createUser('auteur@test.local', 'sada')
    const listing = await Listing.create({
      ...validPayload,
      type: 'offre',
      category: 'outils',
      userId: user.id,
    })

    const response = await client.get(`/api/listings/${listing.id}`)
    response.assertStatus(200)
    assert.equal(response.body().author.id, user.id)
    assert.equal(response.body().author.fullName, 'Habitant')
    assert.equal(response.body().author.zone, 'sada')
    assert.notProperty(response.body().author, 'email')

    const missing = await client.get('/api/listings/999999')
    missing.assertStatus(404)
  })
})
