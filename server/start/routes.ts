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
