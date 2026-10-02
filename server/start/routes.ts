/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { existsSync } from 'node:fs'
import app from '@adonisjs/core/services/app'
import router from '@adonisjs/core/services/router'
import db from '@adonisjs/lucid/services/db'
import { middleware } from '#start/kernel'
import { ZONES } from '#constants/domain'

const AuthController = () => import('#controllers/auth_controller')
const ProfileController = () => import('#controllers/profile_controller')
const ListingsController = () => import('#controllers/listings_controller')
const ExchangeRequestsController = () => import('#controllers/exchange_requests_controller')
const MeController = () => import('#controllers/me_controller')

router
  .group(() => {
    router.get('/health', async () => {
      let database: 'ok' | 'error' = 'ok'
      try {
        await db.rawQuery('SELECT 1')
      } catch {
        database = 'error'
      }

      return {
        status: 'ok',
        service: 'passerelle',
        database,
        time: new Date().toISOString(),
      }
    })

    /** Listes fermées pour les formulaires du front. */
    router.get('/meta', async () => ({
      zones: Object.entries(ZONES).map(([value, label]) => ({ value, label })),
    }))

    router.post('/auth/register', [AuthController, 'register'])
    router.post('/auth/login', [AuthController, 'login'])

    router
      .group(() => {
        router.post('/auth/logout', [AuthController, 'logout'])
        router.get('/me', [ProfileController, 'show'])
        router.patch('/me', [ProfileController, 'update'])
      })
      .use(middleware.auth())

    router.get('/listings', [ListingsController, 'index'])
    router.get('/listings/:id', [ListingsController, 'show']).where('id', router.matchers.number())
    router.post('/listings', [ListingsController, 'store']).use(middleware.auth())
    router
      .post('/listings/:id/close', [ListingsController, 'close'])
      .where('id', router.matchers.number())
      .use(middleware.auth())
    router
      .post('/listings/:id/requests', [ExchangeRequestsController, 'store'])
      .where('id', router.matchers.number())
      .use(middleware.auth())
    router
      .post('/requests/:id/accept', [ExchangeRequestsController, 'accept'])
      .where('id', router.matchers.number())
      .use(middleware.auth())
    router
      .post('/requests/:id/refuse', [ExchangeRequestsController, 'refuse'])
      .where('id', router.matchers.number())
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/listings', [MeController, 'listings'])
        router.get('/requests', [MeController, 'requests'])
      })
      .prefix('/me')
      .use(middleware.auth())

    router.any('/*', async ({ response }) => {
      return response.notFound({ error: 'Route introuvable' })
    })
  })
  .prefix('/api')

/**
 * Fallback SPA : toute route hors /api renvoie le build React (public/index.html).
 * Les fichiers statiques (assets) sont servis en amont par @adonisjs/static.
 */
router.get('*', async ({ request, response }) => {
  // Un fichier introuvable (ex. /assets/x.js) reste une 404, pas la page React.
  if (/\.[a-z0-9]+$/i.test(request.url())) {
    return response.notFound({ error: 'Fichier introuvable' })
  }

  const indexHtml = app.publicPath('index.html')
  if (!existsSync(indexHtml)) {
    return response.notFound({ error: 'Front non buildé (npm run build à la racine)' })
  }
  response.header('Content-Type', 'text/html; charset=utf-8')
  return response.download(indexHtml)
})
